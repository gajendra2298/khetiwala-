import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { RentalRequest, RentalRequestDocument } from '../rental-requests/schemas/rental-request.schema';
import { Address, AddressDocument } from '../addresses/schemas/address.schema';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(RentalRequest.name) private readonly rentalRequestModel: Model<RentalRequestDocument>,
    @InjectModel(Address.name) private readonly addressModel: Model<AddressDocument>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, ...rest } = createUserDto;
    
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new this.userModel({
      ...rest,
      email,
      password: hashedPassword,
    });

    return user.save();
  }

  async findAllUsers(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const { password, ...rest } = updateUserDto;
    
    let updateData: any = { ...rest };
    
    // Hash password if provided
    if (password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Password validation error:', error);
      return false;
    }
  }

  async getUserProfile(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [products, addresses, rentalRequestsAsRequester, rentalRequestsAsOwner] = await Promise.all([
      this.productModel.find({ createdBy: new Types.ObjectId(userId) }).populate('location', 'city state'),
      this.addressModel.find({ userId: new Types.ObjectId(userId) }),
      this.rentalRequestModel.find({ requester: new Types.ObjectId(userId) })
        .populate('product', 'title image')
        .populate('owner', 'name')
        .sort({ createdAt: -1 }),
      this.rentalRequestModel.find({ owner: new Types.ObjectId(userId) })
        .populate('product', 'title image')
        .populate('requester', 'name')
        .sort({ createdAt: -1 }),
    ]);

    // Calculate stats
    const productStats = {
      total: products.length,
      active: products.filter(p => p.status === 'active').length,
      rental: products.filter(p => p.productType === 'rent' || p.productType === 'both').length,
      totalViews: products.reduce((sum, p) => sum + p.viewCount, 0),
      totalRentals: products.reduce((sum, p) => sum + p.rentalCount, 0),
    };

    const rentalStats = {
      requested: rentalRequestsAsRequester.length,
      received: rentalRequestsAsOwner.length,
      pending: [...rentalRequestsAsRequester, ...rentalRequestsAsOwner].filter(r => r.status === 'pending').length,
      approved: [...rentalRequestsAsRequester, ...rentalRequestsAsOwner].filter(r => r.status === 'approved').length,
      completed: [...rentalRequestsAsRequester, ...rentalRequestsAsOwner].filter(r => r.status === 'completed').length,
    };

    return {
      user,
      addresses,
      products,
      rentalRequests: {
        asRequester: rentalRequestsAsRequester,
        asOwner: rentalRequestsAsOwner,
      },
      stats: {
        products: productStats,
        rentals: rentalStats,
      },
    };
  }

  async getUserPublicProfile(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).select('name email role createdAt');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [products, rentalStats] = await Promise.all([
      this.productModel.find({ 
        createdBy: new Types.ObjectId(userId), 
        status: 'active' 
      }).populate('location', 'city state'),
      this.rentalRequestModel.aggregate([
        { $match: { owner: new Types.ObjectId(userId), status: 'returned' } },
        { $group: { _id: null, totalRentals: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
      ])
    ]);

    return {
      user,
      products,
      stats: {
        totalProducts: products.length,
        totalRentals: rentalStats[0]?.totalRentals || 0,
        averageRating: rentalStats[0]?.avgRating || 0,
      },
    };
  }
}
