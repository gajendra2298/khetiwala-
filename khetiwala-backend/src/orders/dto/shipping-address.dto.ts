import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ShippingAddressDto {
  @ApiProperty({
    description: 'Full name of the recipient',
    example: 'John Doe',
  })
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @ApiProperty({
    description: 'Phone number of the recipient',
    example: '+1234567890',
  })
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  phoneNumber: string;

  @ApiProperty({
    description: 'Primary address line',
    example: '123 Main Street',
  })
  @IsString({ message: 'Address line 1 must be a string' })
  @IsNotEmpty({ message: 'Address line 1 is required' })
  addressLine1: string;

  @ApiProperty({
    description: 'Secondary address line (optional)',
    example: 'Apt 4B',
    required: false,
  })
  @IsString({ message: 'Address line 2 must be a string' })
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({
    description: 'City',
    example: 'New York',
  })
  @IsString({ message: 'City must be a string' })
  @IsNotEmpty({ message: 'City is required' })
  city: string;

  @ApiProperty({
    description: 'State',
    example: 'NY',
  })
  @IsString({ message: 'State must be a string' })
  @IsNotEmpty({ message: 'State is required' })
  state: string;

  @ApiProperty({
    description: 'Postal code',
    example: '10001',
  })
  @IsString({ message: 'Pincode must be a string' })
  @IsNotEmpty({ message: 'Pincode is required' })
  pincode: string;

  @ApiProperty({
    description: 'Type of address',
    example: 'Home',
    required: false,
  })
  @IsString({ message: 'Address type must be a string' })
  @IsOptional()
  addressType?: string;
}
