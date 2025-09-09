import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType, NotificationPriority } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  async createNotification(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = new this.notificationModel({
      ...createNotificationDto,
      userId: new Types.ObjectId(createNotificationDto.userId),
      fromUser: createNotificationDto.fromUserId ? new Types.ObjectId(createNotificationDto.fromUserId) : undefined,
      relatedProduct: createNotificationDto.relatedProduct ? new Types.ObjectId(createNotificationDto.relatedProduct) : undefined,
      relatedRentalRequest: createNotificationDto.relatedRentalRequest ? new Types.ObjectId(createNotificationDto.relatedRentalRequest) : undefined,
      relatedMessage: createNotificationDto.relatedMessage ? new Types.ObjectId(createNotificationDto.relatedMessage) : undefined,
      relatedOrder: createNotificationDto.relatedOrder ? new Types.ObjectId(createNotificationDto.relatedOrder) : undefined,
    });

    return notification.save();
  }

  async getUserNotifications(userId: string, limit: number = 50, skip: number = 0): Promise<Notification[]> {
    return this.notificationModel
      .find({ 
        userId: new Types.ObjectId(userId), 
        isDeleted: false 
      })
      .populate('fromUser', 'name email')
      .populate('relatedProduct', 'title image')
      .populate('relatedRentalRequest', 'status')
      .populate('relatedMessage', 'text')
      .populate('relatedOrder', 'status')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ 
        userId: new Types.ObjectId(userId), 
        isRead: false, 
        isDeleted: false 
      })
      .populate('fromUser', 'name email')
      .populate('relatedProduct', 'title image')
      .populate('relatedRentalRequest', 'status')
      .populate('relatedMessage', 'text')
      .populate('relatedOrder', 'status')
      .sort({ priority: -1, createdAt: -1 })
      .exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({ 
      userId: new Types.ObjectId(userId), 
      isRead: false, 
      isDeleted: false 
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel.findOneAndUpdate(
      { 
        _id: new Types.ObjectId(notificationId), 
        userId: new Types.ObjectId(userId) 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { new: true }
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { 
        userId: new Types.ObjectId(userId), 
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationModel.findOneAndUpdate(
      { 
        _id: new Types.ObjectId(notificationId), 
        userId: new Types.ObjectId(userId) 
      },
      { 
        isDeleted: true, 
        deletedAt: new Date() 
      }
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId) },
      { 
        isDeleted: true, 
        deletedAt: new Date() 
      }
    );
  }

  // Helper methods for creating specific notification types
  async createRentalRequestNotification(
    ownerId: string, 
    requesterId: string, 
    productId: string, 
    rentalRequestId: string
  ): Promise<Notification> {
    return this.createNotification({
      userId: ownerId,
      fromUserId: requesterId,
      title: 'New Rental Request',
      message: 'You have received a new rental request for your product',
      type: NotificationType.RENTAL_REQUEST,
      priority: NotificationPriority.HIGH,
      relatedProduct: productId,
      relatedRentalRequest: rentalRequestId,
      actionUrl: `/rental-requests/${rentalRequestId}`,
    });
  }

  async createRentalApprovedNotification(
    requesterId: string, 
    ownerId: string, 
    productId: string, 
    rentalRequestId: string
  ): Promise<Notification> {
    return this.createNotification({
      userId: requesterId,
      fromUserId: ownerId,
      title: 'Rental Request Approved',
      message: 'Your rental request has been approved',
      type: NotificationType.RENTAL_APPROVED,
      priority: NotificationPriority.HIGH,
      relatedProduct: productId,
      relatedRentalRequest: rentalRequestId,
      actionUrl: `/rental-requests/${rentalRequestId}`,
    });
  }

  async createRentalRejectedNotification(
    requesterId: string, 
    ownerId: string, 
    productId: string, 
    rentalRequestId: string
  ): Promise<Notification> {
    return this.createNotification({
      userId: requesterId,
      fromUserId: ownerId,
      title: 'Rental Request Rejected',
      message: 'Your rental request has been rejected',
      type: NotificationType.RENTAL_REJECTED,
      priority: NotificationPriority.MEDIUM,
      relatedProduct: productId,
      relatedRentalRequest: rentalRequestId,
      actionUrl: `/rental-requests/${rentalRequestId}`,
    });
  }

  async createNewMessageNotification(
    receiverId: string, 
    senderId: string, 
    messageId: string, 
    messageText: string
  ): Promise<Notification> {
    return this.createNotification({
      userId: receiverId,
      fromUserId: senderId,
      title: 'New Message',
      message: `You have a new message: ${messageText.substring(0, 50)}...`,
      type: NotificationType.NEW_MESSAGE,
      priority: NotificationPriority.MEDIUM,
      relatedMessage: messageId,
      actionUrl: `/chat`,
    });
  }

  async createProductViewedNotification(
    ownerId: string, 
    viewerId: string, 
    productId: string
  ): Promise<Notification> {
    return this.createNotification({
      userId: ownerId,
      fromUserId: viewerId,
      title: 'Product Viewed',
      message: 'Someone viewed your product',
      type: NotificationType.PRODUCT_VIEWED,
      priority: NotificationPriority.LOW,
      relatedProduct: productId,
      actionUrl: `/products/${productId}`,
    });
  }

  async createSystemAnnouncement(
    userId: string, 
    title: string, 
    message: string, 
    priority: NotificationPriority = NotificationPriority.MEDIUM
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      title,
      message,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      priority,
    });
  }
}
