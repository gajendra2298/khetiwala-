import { ApiProperty } from '@nestjs/swagger';
import { CartItemType } from '../schemas/cart.schema';

export class CartItemResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  product: {
    _id: string;
    title: string;
    description: string;
    price: number;
    rentalPrice?: number;
    image: string;
    productType: string;
    isAvailable: boolean;
    quantity: number;
  };

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  price: number;

  @ApiProperty({ enum: CartItemType })
  itemType: CartItemType;

  @ApiProperty()
  rentalStartDate?: Date;

  @ApiProperty()
  rentalEndDate?: Date;

  @ApiProperty()
  rentalDays?: number;
}

export class CartResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  totalPrice: number;

  @ApiProperty()
  totalRentalPrice: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
