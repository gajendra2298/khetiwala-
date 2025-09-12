import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(ThrottlerGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req: any,
  ): Promise<OrderResponseDto> {
    console.log('Received order data:', JSON.stringify(createOrderDto, null, 2));
    console.log('Shipping address:', JSON.stringify(createOrderDto.shippingAddress, null, 2));
    return this.ordersService.createOrder(createOrderDto, req.user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all orders (Admin/Support only)' })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    type: [OrderResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin/Support access required',
  })
  async findAllOrders(): Promise<OrderResponseDto[]> {
    return this.ordersService.findAllOrders();
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiResponse({
    status: 200,
    description: 'User orders retrieved successfully',
    type: [OrderResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findMyOrders(@Request() req: any): Promise<OrderResponseDto[]> {
    console.log('findMyOrders - User ID:', req.user.sub);
    const orders = await this.ordersService.findOrdersByUser(req.user.sub);
    console.log('findMyOrders - Returning orders:', orders.length);
    return orders;
  }

  @Get('seller-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get orders for current user as seller' })
  @ApiResponse({
    status: 200,
    description: 'Seller orders retrieved successfully',
    type: [OrderResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findSellerOrders(@Request() req: any): Promise<OrderResponseDto[]> {
    console.log('findSellerOrders - Seller ID:', req.user.sub);
    const orders = await this.ordersService.findOrdersBySeller(req.user.sub);
    console.log('findSellerOrders - Returning orders:', orders.length);
    return orders;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not order owner or admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async findOrderById(
    @Param('id', ParseMongoIdPipe) id: string,
    @Request() req: any,
  ): Promise<OrderResponseDto> {
    return this.ordersService.findOrderById(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update order status (Order owner or seller)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Order owner or seller access required',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async updateOrderStatus(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req: any,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateOrderStatus(id, { status: updateOrderDto.status! }, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete order (Admin only)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async deleteOrder(
    @Param('id', ParseMongoIdPipe) id: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    await this.ordersService.deleteOrder(id, req.user.sub);
    return { message: 'Order deleted successfully' };
  }
}
