import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument, ProductType } from './schemas/product.schema';
import { Address, AddressDocument } from '../addresses/schemas/address.schema';
import { CreateProductDto } from './dto/create-product.dto';

export interface UpdateProductDto {
  title?: string;
  description?: string;
  price?: number;
  rentalPrice?: number;
  image?: string;
  additionalImages?: string[];
  productType?: ProductType;
  isAvailable?: boolean;
  quantity?: number;
  category?: string;
  condition?: string;
  location?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(Address.name) private readonly addressModel: Model<AddressDocument>,
  ) {}

  async createProduct(createProductDto: CreateProductDto, userId: string): Promise<Product> {
    const { location, productType, rentalPrice, ...productData } = createProductDto;

    // Validate address requirement for rental products
    if (productType === ProductType.RENT || productType === ProductType.BOTH) {
      if (!location) {
        throw new BadRequestException('Address is required for rental products');
      }

      // Validate that the address belongs to the user
      const address = await this.addressModel.findOne({
        _id: new Types.ObjectId(location),
        userId: new Types.ObjectId(userId),
      });

      if (!address) {
        throw new BadRequestException('Invalid address or address does not belong to you');
      }

      // Validate rental price for rental products
      if (!rentalPrice || rentalPrice <= 0) {
        throw new BadRequestException('Rental price is required and must be greater than 0 for rental products');
      }
    }

    const product = new this.productModel({
      ...productData,
      createdBy: new Types.ObjectId(userId),
      location: location ? new Types.ObjectId(location) : undefined,
    });

    return product.save();
  }

  async findAllProducts(filters?: {
    productType?: ProductType;
    category?: string;
    isAvailable?: boolean;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }): Promise<Product[]> {
    const query: any = { status: 'active' };

    if (filters) {
      if (filters.productType) {
        query.productType = { $in: [filters.productType, ProductType.BOTH] };
      }
      if (filters.category) {
        query.category = filters.category;
      }
      if (filters.isAvailable !== undefined) {
        query.isAvailable = filters.isAvailable;
      }
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        query.price = {};
        if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
        if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
      }
      if (filters.search) {
        query.$or = [
          { title: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } },
          { category: { $regex: filters.search, $options: 'i' } },
        ];
      }
    }

    return this.productModel
      .find(query)
      .populate('createdBy', 'name email')
      .populate('location', 'city state')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .populate('createdBy', 'name email')
      .populate('location', 'fullName addressLine1 city state pincode')
      .exec();
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Increment view count
    await this.productModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
    
    return product;
  }

  async findProductsByUser(userId: string): Promise<Product[]> {
    return this.productModel
      .find({ createdBy: new Types.ObjectId(userId) })
      .populate('createdBy', 'name email')
      .populate('location', 'city state')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getUserProductStats(userId: string): Promise<any> {
    const [totalProducts, activeProducts, rentalProducts, totalViews, totalRentals] = await Promise.all([
      this.productModel.countDocuments({ createdBy: new Types.ObjectId(userId) }),
      this.productModel.countDocuments({ createdBy: new Types.ObjectId(userId), status: 'active' }),
      this.productModel.countDocuments({ 
        createdBy: new Types.ObjectId(userId), 
        productType: { $in: ['rent', 'both'] } 
      }),
      this.productModel.aggregate([
        { $match: { createdBy: new Types.ObjectId(userId) } },
        { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
      ]),
      this.productModel.aggregate([
        { $match: { createdBy: new Types.ObjectId(userId) } },
        { $group: { _id: null, totalRentals: { $sum: '$rentalCount' } } }
      ])
    ]);

    return {
      totalProducts,
      activeProducts,
      rentalProducts,
      totalViews: totalViews[0]?.totalViews || 0,
      totalRentals: totalRentals[0]?.totalRentals || 0,
    };
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto, userId: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user is the creator or admin
    if (product.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only update your own products');
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .populate('createdBy', 'name email')
      .exec();

    return updatedProduct!;
  }

  async deleteProduct(id: string, userId: string): Promise<void> {
    const product = await this.productModel.findById(id).exec();
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user is the creator or admin
    if (product.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own products');
    }

    await this.productModel.findByIdAndDelete(id).exec();
  }
}
