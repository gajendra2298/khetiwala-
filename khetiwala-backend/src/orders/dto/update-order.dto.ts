import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { OrderStatus } from '../schemas/order.schema';

export class UpdateOrderDto {
  @ApiPropertyOptional({
    description: 'Order status',
    enum: OrderStatus,
    example: OrderStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Status must be a valid order status' })
  status?: OrderStatus;
}
