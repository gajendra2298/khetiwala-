import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsOptional, 
  IsString, 
  IsNumber, 
  Min, 
  Max,
  Length,
  ValidateIf
} from 'class-validator';
import { RentalRequestStatus } from '../schemas/rental-request.schema';

export class UpdateRentalRequestDto {
  @ApiPropertyOptional({ 
    description: 'Rental request status', 
    enum: RentalRequestStatus,
    example: RentalRequestStatus.APPROVED,
  })
  @IsEnum(RentalRequestStatus, { message: 'Status must be a valid rental request status' })
  @IsOptional()
  status?: RentalRequestStatus;

  @ApiPropertyOptional({ 
    description: 'Rejection reason (required if status is rejected)',
    example: 'Product is not available for the requested dates',
    maxLength: 500,
  })
  @ValidateIf(o => o.status === RentalRequestStatus.REJECTED)
  @IsString({ message: 'Rejection reason must be a string' })
  @Length(1, 500, { message: 'Rejection reason must be between 1 and 500 characters' })
  @IsOptional()
  rejectionReason?: string;

  @ApiPropertyOptional({ 
    description: 'Delivery notes',
    example: 'Please deliver between 9 AM to 5 PM',
    maxLength: 1000,
  })
  @IsString({ message: 'Delivery notes must be a string' })
  @Length(0, 1000, { message: 'Delivery notes must not exceed 1000 characters' })
  @IsOptional()
  deliveryNotes?: string;

  @ApiPropertyOptional({ 
    description: 'Return notes',
    example: 'Product returned in good condition',
    maxLength: 1000,
  })
  @IsString({ message: 'Return notes must be a string' })
  @Length(0, 1000, { message: 'Return notes must not exceed 1000 characters' })
  @IsOptional()
  returnNotes?: string;

  @ApiPropertyOptional({ 
    description: 'Rating (1-5)', 
    minimum: 1, 
    maximum: 5,
    example: 5,
  })
  @IsNumber({}, { message: 'Rating must be a number' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ 
    description: 'Review text',
    example: 'Excellent product and great service!',
    maxLength: 1000,
  })
  @IsString({ message: 'Review must be a string' })
  @Length(0, 1000, { message: 'Review must not exceed 1000 characters' })
  @IsOptional()
  review?: string;
}
