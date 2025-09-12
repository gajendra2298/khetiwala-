import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { ProductsService } from '../products/products.service';
import { ChatService } from '../chat/chat.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { ChatType, MessageType } from '../chat/schemas/message.schema';

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly productsService: ProductsService,
    private readonly chatService: ChatService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto, userId: string): Promise<OrderDocument> {
    const orderItems: any[] = [];
    const sellerIds = new Set<string>();

    // Process order items and collect unique seller IDs
    for (const item of createOrderDto.products) {
      // Get product details to find seller
      const product = await this.productsService.findProductById(item.product.toString());
      const sellerId = product.createdBy.toString();
      sellerIds.add(sellerId);

      orderItems.push({
        product: item.product, // Already a Types.ObjectId from DTO
        seller: product.createdBy, // Use the ObjectId directly from product
        quantity: item.quantity,
        price: item.price,
      });
    }

    // Generate unique order number
    const orderNumber = await this.generateOrderNumber();

    const order = new this.orderModel({
      user: new Types.ObjectId(userId),
      products: orderItems,
      totalPrice: createOrderDto.totalPrice,
      status: OrderStatus.PENDING,
      orderNumber: orderNumber,
      shippingAddress: createOrderDto.shippingAddress,
    });

    const savedOrder = await order.save();

    // Notify each seller and create chat conversations
    for (const sellerId of sellerIds) {
      try {
        // Create a system message to notify the seller about the new order
        await this.chatService.createMessage({
          sender: userId,
          recipientId: sellerId,
          content: `New order #${orderNumber} has been placed. Order total: ₹${createOrderDto.totalPrice}. Please check your orders for details.`,
          messageType: MessageType.SYSTEM,
          chatType: ChatType.USER_TO_USER,
          relatedProduct: orderItems[0]?.product, // Link to first product for context
        });
      } catch (error) {
        console.error(`Failed to notify seller ${sellerId} about order ${orderNumber}:`, error);
        // Don't fail the order creation if chat notification fails
      }
    }

    return savedOrder;
  }

  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderNumber = `ORD-${timestamp}-${random}`;
    
    // Check if order number already exists (very unlikely but safe)
    const existingOrder = await this.orderModel.findOne({ orderNumber });
    if (existingOrder) {
      // If it exists, generate a new one recursively
      return this.generateOrderNumber();
    }
    
    return orderNumber;
  }

  async findAllOrders(): Promise<OrderDocument[]> {
    return this.orderModel
      .find()
      .populate('user', 'name email')
      .populate('products.product', 'title price image')
      .populate('products.seller', 'name email')
      .exec();
  }

  async findOrderById(id: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findById(id)
      .populate('user', 'name email')
      .populate('products.product', 'title price image')
      .populate('products.seller', 'name email')
      .exec();
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    
    return order;
  }

  async findOrdersByUser(userId: string): Promise<OrderDocument[]> {
    console.log('Finding orders for user:', userId);
    const orders = await this.orderModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('user', 'name email')
      .populate('products.product', 'title price image')
      .populate('products.seller', 'name email')
      .exec();
    console.log('Found orders count:', orders.length);
    console.log('Orders data:', JSON.stringify(orders, null, 2));
    return orders;
  }

  async updateOrderStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto, userId: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).exec();
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user is the order owner OR a seller in this order
    const isOrderOwner = order.user.toString() === userId;
    const isSeller = order.products.some(product => product.seller.toString() === userId);
    
    if (!isOrderOwner && !isSeller) {
      throw new ForbiddenException('You can only update orders you own or where you are a seller');
    }

    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(id, updateOrderStatusDto, { new: true })
      .populate('user', 'name email')
      .populate('products.product', 'title price image')
      .populate('products.seller', 'name email')
      .exec();

    return updatedOrder!;
  }

  async findOrdersBySeller(sellerId: string): Promise<OrderDocument[]> {
    console.log('Finding orders for seller:', sellerId);
    const orders = await this.orderModel
      .find({ 'products.seller': new Types.ObjectId(sellerId) })
      .populate('user', 'name email')
      .populate('products.product', 'title price image')
      .populate('products.seller', 'name email')
      .exec();
    console.log('Found orders count for seller:', orders.length);
    return orders;
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
