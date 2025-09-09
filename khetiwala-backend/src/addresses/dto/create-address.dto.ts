import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsBoolean, 
  IsPhoneNumber,
  Length,
  Matches,
  IsEnum
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AddressType {
  HOME = 'home',
  WORK = 'work',
  OTHER = 'other',
}

export class CreateAddressDto {
  @ApiProperty({ 
    description: 'Full name for the address',
    example: 'John Doe',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  @Length(2, 50, { message: 'Full name must be between 2 and 50 characters' })
  @Matches(/^[a-zA-Z\s]+$/, { message: 'Full name can only contain letters and spaces' })
  fullName: string;

  @ApiProperty({ 
    description: 'Phone number',
    example: '+919876543210',
  })
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^(\+91|91)?[6-9]\d{9}$/, { message: 'Please provide a valid Indian phone number' })
  phoneNumber: string;

  @ApiProperty({ 
    description: 'Address line 1',
    example: '123 Main Street, Near City Mall',
    minLength: 5,
    maxLength: 100,
  })
  @IsString({ message: 'Address line 1 must be a string' })
  @IsNotEmpty({ message: 'Address line 1 is required' })
  @Length(5, 100, { message: 'Address line 1 must be between 5 and 100 characters' })
  addressLine1: string;

  @ApiPropertyOptional({ 
    description: 'Address line 2',
    example: 'Apartment 4B, Building A',
    maxLength: 100,
  })
  @IsString({ message: 'Address line 2 must be a string' })
  @Length(0, 100, { message: 'Address line 2 must not exceed 100 characters' })
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ 
    description: 'City',
    example: 'Mumbai',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'City must be a string' })
  @IsNotEmpty({ message: 'City is required' })
  @Length(2, 50, { message: 'City must be between 2 and 50 characters' })
  @Matches(/^[a-zA-Z\s]+$/, { message: 'City can only contain letters and spaces' })
  city: string;

  @ApiProperty({ 
    description: 'State',
    example: 'Maharashtra',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'State must be a string' })
  @IsNotEmpty({ message: 'State is required' })
  @Length(2, 50, { message: 'State must be between 2 and 50 characters' })
  @Matches(/^[a-zA-Z\s]+$/, { message: 'State can only contain letters and spaces' })
  state: string;

  @ApiProperty({ 
    description: 'Pincode (6 digits)',
    example: '400001',
  })
  @IsString({ message: 'Pincode must be a string' })
  @IsNotEmpty({ message: 'Pincode is required' })
  @Matches(/^[1-9][0-9]{5}$/, { message: 'Pincode must be a valid 6-digit Indian pincode' })
  pincode: string;

  @ApiProperty({ 
    description: 'Country',
    example: 'India',
    default: 'India',
  })
  @IsString({ message: 'Country must be a string' })
  @IsNotEmpty({ message: 'Country is required' })
  @Length(2, 50, { message: 'Country must be between 2 and 50 characters' })
  @Matches(/^[a-zA-Z\s]+$/, { message: 'Country can only contain letters and spaces' })
  country: string;

  @ApiPropertyOptional({ 
    description: 'Address type',
    enum: AddressType,
    default: AddressType.HOME,
  })
  @IsEnum(AddressType, { message: 'Address type must be one of: home, work, other' })
  @IsOptional()
  addressType?: AddressType;

  @ApiPropertyOptional({ 
    description: 'Set as active address',
    default: false,
  })
  @IsBoolean({ message: 'isActive must be a boolean value' })
  @IsOptional()
  isActive?: boolean;
}
