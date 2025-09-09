import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsMongoId, IsNumber, Min } from 'class-validator';
import { Types } from 'mongoose';

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'Product ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId({ message: 'Product ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Product ID is required' })
  product: Types.ObjectId;

  @ApiProperty({
    description: 'Quantity of the product',
    example: 2,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @ApiProperty({
    description: 'Price per unit at the time of order',
    example: 150.50,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price: number;
}
