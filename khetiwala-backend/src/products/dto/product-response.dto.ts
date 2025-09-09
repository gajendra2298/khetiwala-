import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class ProductResponseDto {
  @ApiProperty({
    description: 'Product ID',
    example: '507f1f77bcf86cd799439011',
  })
  _id: any;

  @ApiProperty({
    description: 'Product title',
    example: 'Organic Tomatoes',
  })
  title: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Fresh organic tomatoes grown without pesticides',
  })
  description: string;

  @ApiProperty({
    description: 'Product price in INR',
    example: 150.50,
  })
  price: number;

  @ApiProperty({
    description: 'Product image URL',
    example: 'https://example.com/tomatoes.jpg',
  })
  image: string;

  @ApiProperty({
    description: 'ID of the user who created this product',
    example: '507f1f77bcf86cd799439011',
  })
  createdBy: Types.ObjectId;

  @ApiProperty({
    description: 'Product creation date',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Product last update date',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}
