import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsNumber, 
  IsEnum, 
  IsOptional, 
  IsDateString, 
  Min, 
  Max,
  ValidateIf
} from 'class-validator';
import { CartItemType } from '../schemas/cart.schema';

export class UpdateCartItemDto {
  @ApiPropertyOptional({ 
    description: 'Quantity to update', 
    minimum: 1,
    maximum: 100,
    example: 3,
  })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(100, { message: 'Quantity must not exceed 100' })
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ 
    description: 'Item type', 
    enum: CartItemType,
    example: CartItemType.RENT,
  })
  @IsEnum(CartItemType, { message: 'Item type must be either "sale" or "rent"' })
  @IsOptional()
  itemType?: CartItemType;

  @ApiPropertyOptional({ 
    description: 'Rental start date',
    example: '2024-01-15',
  })
  @ValidateIf(o => o.itemType === CartItemType.RENT)
  @IsDateString({}, { message: 'Rental start date must be a valid date string (YYYY-MM-DD)' })
  @IsOptional()
  rentalStartDate?: string;

  @ApiPropertyOptional({ 
    description: 'Rental end date',
    example: '2024-01-20',
  })
  @ValidateIf(o => o.itemType === CartItemType.RENT)
  @IsDateString({}, { message: 'Rental end date must be a valid date string (YYYY-MM-DD)' })
  @IsOptional()
  rentalEndDate?: string;
}
