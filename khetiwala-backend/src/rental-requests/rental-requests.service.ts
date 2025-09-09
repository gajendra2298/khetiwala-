import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RentalRequest, RentalRequestDocument, RentalRequestStatus } from './schemas/rental-request.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Address, AddressDocument } from '../addresses/schemas/address.schema';
import { CreateRentalRequestDto } from './dto/create-rental-request.dto';
import { UpdateRentalRequestDto } from './dto/update-rental-request.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RentalRequestsService {
  constructor(
    @InjectModel(RentalRequest.name) private rentalRequestModel: Model<RentalRequestDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createRentalRequest(userId: string, createRentalRequestDto: CreateRentalRequestDto): Promise<RentalRequest> {
    const { productId, deliveryAddressId, startDate, endDate, message } = createRentalRequestDto;

    // Validate product exists and is available for rent
    const product = await this.productModel.findById(productId).populate('createdBy');
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.createdBy.toString() === userId) {
      throw new BadRequestException('Cannot rent your own product');
    }

    if (!product.rentalPrice) {
      throw new BadRequestException('Product is not available for rent');
    }

    if (!product.isAvailable || product.status !== 'active') {
      throw new BadRequestException('Product is not available');
    }

    // Validate delivery address belongs to user
    const deliveryAddress = await this.addressModel.findOne({
      _id: new Types.ObjectId(deliveryAddressId),
      userId: new Types.ObjectId(userId),
    });

    if (!deliveryAddress) {
      throw new NotFoundException('Delivery address not found');
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start <= now) {
      throw new BadRequestException('Start date must be in the future');
    }

    if (end <= start) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check for existing rental requests for the same period
    const existingRequest = await this.rentalRequestModel.findOne({
      product: new Types.ObjectId(productId),
      status: { $in: [RentalRequestStatus.PENDING, RentalRequestStatus.APPROVED] },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start },
        },
      ],
    });

    if (existingRequest) {
      throw new BadRequestException('Product is already requested/rented for this period');
    }

    const rentalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = product.rentalPrice * rentalDays;

    const rentalRequest = new this.rentalRequestModel({
      requester: new Types.ObjectId(userId),
      owner: product.createdBy,
      product: new Types.ObjectId(productId),
      deliveryAddress: new Types.ObjectId(deliveryAddressId),
      startDate: start,
      endDate: end,
      rentalDays,
      dailyRate: product.rentalPrice,
      totalAmount,
      message,
    });

    const savedRequest = await rentalRequest.save();

    // Create notification for the product owner
    try {
      await this.notificationsService.createRentalRequestNotification(
        String(product.createdBy),
        userId,
        productId,
        String(savedRequest._id)
      );
    } catch (error) {
      console.error('Error creating rental request notification:', error);
    }

    return savedRequest;
  }

  async findAllByRequester(userId: string): Promise<RentalRequest[]> {
    return this.rentalRequestModel
      .find({ requester: new Types.ObjectId(userId) })
      .populate('owner', 'name email')
      .populate('product', 'title description image rentalPrice')
      .populate('deliveryAddress', 'fullName addressLine1 city state pincode')
      .sort({ createdAt: -1 });
  }

  async findAllByOwner(userId: string): Promise<RentalRequest[]> {
    return this.rentalRequestModel
      .find({ owner: new Types.ObjectId(userId) })
      .populate('requester', 'name email')
      .populate('product', 'title description image rentalPrice')
      .populate('deliveryAddress', 'fullName addressLine1 city state pincode')
      .sort({ createdAt: -1 });
  }

  async findById(requestId: string, userId: string): Promise<RentalRequest> {
    const rentalRequest = await this.rentalRequestModel
      .findOne({
        _id: new Types.ObjectId(requestId),
        $or: [
          { requester: new Types.ObjectId(userId) },
          { owner: new Types.ObjectId(userId) },
        ],
      })
      .populate('requester', 'name email')
      .populate('owner', 'name email')
      .populate('product', 'title description image rentalPrice')
      .populate('deliveryAddress', 'fullName addressLine1 city state pincode');

    if (!rentalRequest) {
      throw new NotFoundException('Rental request not found');
    }

    return rentalRequest;
  }

  async updateRentalRequest(
    requestId: string,
    userId: string,
    updateRentalRequestDto: UpdateRentalRequestDto,
  ): Promise<RentalRequest> {
    const { status, rejectionReason, deliveryNotes, returnNotes, rating, review } = updateRentalRequestDto;

    const rentalRequest = await this.rentalRequestModel.findById(requestId);
    if (!rentalRequest) {
      throw new NotFoundException('Rental request not found');
    }

    // Check permissions
    const isOwner = rentalRequest.owner.toString() === userId;
    const isRequester = rentalRequest.requester.toString() === userId;

    if (!isOwner && !isRequester) {
      throw new ForbiddenException('Not authorized to update this rental request');
    }

    // Owner can approve/reject and manage delivery/return
    if (isOwner) {
      if (status === RentalRequestStatus.APPROVED) {
        if (rentalRequest.status !== RentalRequestStatus.PENDING) {
          throw new BadRequestException('Can only approve pending requests');
        }
        rentalRequest.status = status;
        rentalRequest.approvedAt = new Date();
        
        // Create notification for requester
        try {
          await this.notificationsService.createRentalApprovedNotification(
            String(rentalRequest.requester),
            String(rentalRequest.owner),
            String(rentalRequest.product),
            String(rentalRequest._id)
          );
        } catch (error) {
          console.error('Error creating rental approved notification:', error);
        }
      } else if (status === RentalRequestStatus.REJECTED) {
        if (rentalRequest.status !== RentalRequestStatus.PENDING) {
          throw new BadRequestException('Can only reject pending requests');
        }
        if (!rejectionReason) {
          throw new BadRequestException('Rejection reason is required');
        }
        rentalRequest.status = status;
        rentalRequest.rejectionReason = rejectionReason;
        
        // Create notification for requester
        try {
          await this.notificationsService.createRentalRejectedNotification(
            String(rentalRequest.requester),
            String(rentalRequest.owner),
            String(rentalRequest.product),
            String(rentalRequest._id)
          );
        } catch (error) {
          console.error('Error creating rental rejected notification:', error);
        }
      } else if (status === RentalRequestStatus.COMPLETED) {
        if (rentalRequest.status !== RentalRequestStatus.APPROVED) {
          throw new BadRequestException('Can only complete approved requests');
        }
        rentalRequest.status = status;
        rentalRequest.deliveredAt = new Date();
        rentalRequest.isDelivered = true;
      } else if (status === RentalRequestStatus.RETURNED) {
        if (rentalRequest.status !== RentalRequestStatus.COMPLETED) {
          throw new BadRequestException('Can only mark returned from completed requests');
        }
        rentalRequest.status = status;
        rentalRequest.returnedAt = new Date();
        rentalRequest.isReturned = true;
      }

      if (deliveryNotes !== undefined) {
        rentalRequest.deliveryNotes = deliveryNotes;
      }
      if (returnNotes !== undefined) {
        rentalRequest.returnNotes = returnNotes;
      }
    }

    // Requester can cancel and rate/review
    if (isRequester) {
      if (status === RentalRequestStatus.CANCELLED) {
        if (rentalRequest.status !== RentalRequestStatus.PENDING) {
          throw new BadRequestException('Can only cancel pending requests');
        }
        rentalRequest.status = status;
      }

      if (rating !== undefined) {
        if (rentalRequest.status !== RentalRequestStatus.RETURNED) {
          throw new BadRequestException('Can only rate after return');
        }
        if (rating < 1 || rating > 5) {
          throw new BadRequestException('Rating must be between 1 and 5');
        }
        rentalRequest.rating = rating;
      }

      if (review !== undefined) {
        if (rentalRequest.status !== RentalRequestStatus.RETURNED) {
          throw new BadRequestException('Can only review after return');
        }
        rentalRequest.review = review;
      }
    }

    return rentalRequest.save();
  }

  async deleteRentalRequest(requestId: string, userId: string): Promise<void> {
    const rentalRequest = await this.rentalRequestModel.findOne({
      _id: new Types.ObjectId(requestId),
      requester: new Types.ObjectId(userId),
      status: RentalRequestStatus.PENDING,
    });

    if (!rentalRequest) {
      throw new NotFoundException('Rental request not found or cannot be deleted');
    }

    await this.rentalRequestModel.findByIdAndDelete(requestId);
  }

  async getRentalStats(userId: string): Promise<any> {
    const [asRequester, asOwner] = await Promise.all([
      this.rentalRequestModel.aggregate([
        { $match: { requester: new Types.ObjectId(userId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.rentalRequestModel.aggregate([
        { $match: { owner: new Types.ObjectId(userId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      asRequester: asRequester.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      asOwner: asOwner.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
    };
  }
}
