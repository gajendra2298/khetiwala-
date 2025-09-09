import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  IsEnum, 
  IsOptional, 
  IsDateString, 
  Min, 
  Max,
  IsMongoId,
  ValidateIf
} from 'class-validator';
import { CartItemType } from '../schemas/cart.schema';

export class AddToCartDto {
  @ApiProperty({ 
    description: 'Product ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString({ message: 'Product ID must be a string' })
  @IsNotEmpty({ message: 'Product ID is required' })
  @IsMongoId({ message: 'Product ID must be a valid MongoDB ObjectId' })
  productId: string;

  @ApiProperty({ 
    description: 'Quantity to add', 
    minimum: 1,
    maximum: 100,
    example: 2,
  })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(100, { message: 'Quantity must not exceed 100' })
  quantity: number;

  @ApiProperty({ 
    description: 'Item type', 
    enum: CartItemType,
    default: CartItemType.SALE,
    example: CartItemType.SALE,
  })
  @IsEnum(CartItemType, { message: 'Item type must be either "sale" or "rent"' })
  itemType: CartItemType;

  @ApiPropertyOptional({ 
    description: 'Rental start date (required for rental items)',
    example: '2024-01-15',
  })
  @ValidateIf(o => o.itemType === CartItemType.RENT)
  @IsDateString({}, { message: 'Rental start date must be a valid date string (YYYY-MM-DD)' })
  @IsOptional()
  rentalStartDate?: string;

  @ApiPropertyOptional({ 
    description: 'Rental end date (required for rental items)',
    example: '2024-01-20',
  })
  @ValidateIf(o => o.itemType === CartItemType.RENT)
  @IsDateString({}, { message: 'Rental end date must be a valid date string (YYYY-MM-DD)' })
  @IsOptional()
  rentalEndDate?: string;
}
