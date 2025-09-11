import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, ValidateNested, IsNumber, Min, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';
import { ShippingAddressDto } from './shipping-address.dto';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Array of order items',
    type: [CreateOrderItemDto],
    minItems: 1,
  })
  @IsArray({ message: 'Products must be an array' })
  @ArrayMinSize(1, { message: 'At least one product is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  products: CreateOrderItemDto[];

  @ApiProperty({
    description: 'Total price of the order',
    example: 301.00,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Total price must be a number' })
  @Min(0, { message: 'Total price must be greater than or equal to 0' })
  totalPrice: number;

  @ApiProperty({
    description: 'Shipping address for the order',
    type: ShippingAddressDto,
  })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;
}
