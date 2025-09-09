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
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, description: 'Notification created successfully', type: NotificationResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createNotification(@Body() createNotificationDto: CreateNotificationDto): Promise<NotificationResponseDto> {
    const notification = await this.notificationsService.createNotification(createNotificationDto);
    return notification as any;
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of notifications to return' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of notifications to skip' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully', type: [NotificationResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserNotifications(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationsService.getUserNotifications(
      req.user.sub, 
      limit || 50, 
      skip || 0
    );
    return notifications as any;
  }

  @Get('unread')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get unread notifications' })
  @ApiResponse({ status: 200, description: 'Unread notifications retrieved successfully', type: [NotificationResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadNotifications(@Request() req: any): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationsService.getUnreadNotifications(req.user.sub);
    return notifications as any;
  }

  @Get('unread-count')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@Request() req: any): Promise<{ count: number }> {
    const count = await this.notificationsService.getUnreadCount(req.user.sub);
    return { count };
  }

  @Patch(':id/read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read', type: NotificationResponseDto })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAsRead(@Request() req: any, @Param('id') id: string): Promise<NotificationResponseDto> {
    const notification = await this.notificationsService.markAsRead(id, req.user.sub);
    return notification as any;
  }

  @Patch('mark-all-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 204, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(@Request() req: any): Promise<void> {
    await this.notificationsService.markAllAsRead(req.user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 204, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteNotification(@Request() req: any, @Param('id') id: string): Promise<void> {
    await this.notificationsService.deleteNotification(id, req.user.sub);
  }

  @Delete('all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete all notifications' })
  @ApiResponse({ status: 204, description: 'All notifications deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAllNotifications(@Request() req: any): Promise<void> {
    await this.notificationsService.deleteAllNotifications(req.user.sub);
  }
}
