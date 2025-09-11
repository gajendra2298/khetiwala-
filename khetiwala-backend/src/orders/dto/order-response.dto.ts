import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { OrderStatus } from '../schemas/order.schema';
import { ShippingAddressDto } from './shipping-address.dto';

export class OrderItemResponseDto {
  @ApiProperty({
    description: 'Product ID',
    example: '507f1f77bcf86cd799439011',
  })
  product: Types.ObjectId;

  @ApiProperty({
    description: 'Quantity of the product',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'Price per unit at the time of order',
    example: 150.50,
  })
  price: number;
}

export class OrderResponseDto {
  @ApiProperty({
    description: 'Order ID',
    example: '507f1f77bcf86cd799439011',
  })
  _id: any;

  @ApiProperty({
    description: 'User ID who placed the order',
    example: '507f1f77bcf86cd799439011',
  })
  user: Types.ObjectId;

  @ApiProperty({
    description: 'Array of order items',
    type: [OrderItemResponseDto],
  })
  products: OrderItemResponseDto[];

  @ApiProperty({
    description: 'Total price of the order',
    example: 301.00,
  })
  totalPrice: number;

  @ApiProperty({
    description: 'Order status',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Unique order number',
    example: 'ORD-1736634195123-456',
    required: false,
  })
  orderNumber?: string;

  @ApiProperty({
    description: 'Shipping address for the order',
    type: ShippingAddressDto,
  })
  shippingAddress: ShippingAddressDto;

  @ApiProperty({
    description: 'Order creation date',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Order last update date',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}
