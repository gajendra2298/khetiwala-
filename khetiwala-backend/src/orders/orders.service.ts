import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly productsService: ProductsService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto, userId: string): Promise<OrderDocument> {
    const orderItems: any[] = [];

    // Process order items
    for (const item of createOrderDto.products) {
      orderItems.push({
        product: item.product, // Already a Types.ObjectId from DTO
        quantity: item.quantity,
        price: item.price,
      });
    }

    const order = new this.orderModel({
      user: new Types.ObjectId(userId),
      products: orderItems,
      totalPrice: createOrderDto.totalPrice,
      status: OrderStatus.PENDING,
    });

    return order.save();
  }

  async findAllOrders(): Promise<OrderDocument[]> {
    return this.orderModel
      .find()
      .populate('user', 'name email')
      .populate('products.product', 'title price image')
      .exec();
  }

  async findOrderById(id: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findById(id)
      .populate('user', 'name email')
      .populate('products.product', 'title price image')
      .exec();
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    
    return order;
  }

  async findOrdersByUser(userId: string): Promise<OrderDocument[]> {
    return this.orderModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('user', 'name email')
      .populate('products.product', 'title price image')
      .exec();
  }

  async updateOrderStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto, userId: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).exec();
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user is the order owner or admin
    if (order.user.toString() !== userId) {
      throw new ForbiddenException('You can only update your own orders');
    }

    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(id, updateOrderStatusDto, { new: true })
      .populate('user', 'name email')
      .populate('products.product', 'title price image')
      .exec();

    return updatedOrder!;
  }

  async deleteOrder(id: string, userId: string): Promise<void> {
    const order = await this.orderModel.findById(id).exec();
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user is the order owner or admin
    if (order.user.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own orders');
    }

    await this.orderModel.findByIdAndDelete(id).exec();
  }
}
