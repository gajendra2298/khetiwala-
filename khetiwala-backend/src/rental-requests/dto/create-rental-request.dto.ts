import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsDateString, 
  IsOptional, 
  IsMongoId,
  Length,
  MinDate
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRentalRequestDto {
  @ApiProperty({ 
    description: 'Product ID to rent',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString({ message: 'Product ID must be a string' })
  @IsNotEmpty({ message: 'Product ID is required' })
  @IsMongoId({ message: 'Product ID must be a valid MongoDB ObjectId' })
  productId: string;

  @ApiProperty({ 
    description: 'Delivery address ID',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString({ message: 'Delivery address ID must be a string' })
  @IsNotEmpty({ message: 'Delivery address ID is required' })
  @IsMongoId({ message: 'Delivery address ID must be a valid MongoDB ObjectId' })
  deliveryAddressId: string;

  @ApiProperty({ 
    description: 'Rental start date (must be in the future)', 
    example: '2024-01-15',
  })
  @IsDateString({}, { message: 'Start date must be a valid date string (YYYY-MM-DD)' })
  @Type(() => Date)
  @MinDate(new Date(), { message: 'Start date must be in the future' })
  startDate: string;

  @ApiProperty({ 
    description: 'Rental end date (must be after start date)', 
    example: '2024-01-20',
  })
  @IsDateString({}, { message: 'End date must be a valid date string (YYYY-MM-DD)' })
  @Type(() => Date)
  @MinDate(new Date(), { message: 'End date must be in the future' })
  endDate: string;

  @ApiPropertyOptional({ 
    description: 'Message to the product owner',
    example: 'I would like to rent this product for my event. Please let me know if available.',
    maxLength: 500,
  })
  @IsString({ message: 'Message must be a string' })
  @Length(0, 500, { message: 'Message must not exceed 500 characters' })
  @IsOptional()
  message?: string;
}
