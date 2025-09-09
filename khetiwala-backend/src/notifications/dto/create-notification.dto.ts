import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsMongoId, 
  IsUrl,
  Length,
  MaxLength,
  IsDateString
} from 'class-validator';
import { NotificationType, NotificationPriority } from '../schemas/notification.schema';

export class CreateNotificationDto {
  @ApiProperty({ 
    description: 'User ID to send notification to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID is required' })
  @IsMongoId({ message: 'User ID must be a valid MongoDB ObjectId' })
  userId: string;

  @ApiPropertyOptional({ 
    description: 'User ID who triggered the notification',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString({ message: 'From user ID must be a string' })
  @IsMongoId({ message: 'From user ID must be a valid MongoDB ObjectId' })
  @IsOptional()
  fromUserId?: string;

  @ApiProperty({ 
    description: 'Notification title',
    example: 'New Rental Request',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @Length(3, 100, { message: 'Title must be between 3 and 100 characters' })
  title: string;

  @ApiProperty({ 
    description: 'Notification message',
    example: 'You have received a new rental request for your product.',
    minLength: 5,
    maxLength: 500,
  })
  @IsString({ message: 'Message must be a string' })
  @IsNotEmpty({ message: 'Message is required' })
  @Length(5, 500, { message: 'Message must be between 5 and 500 characters' })
  message: string;

  @ApiProperty({ 
    description: 'Notification type', 
    enum: NotificationType,
    example: NotificationType.RENTAL_REQUEST,
  })
  @IsEnum(NotificationType, { message: 'Type must be a valid notification type' })
  type: NotificationType;

  @ApiPropertyOptional({ 
    description: 'Notification priority', 
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
    example: NotificationPriority.MEDIUM,
  })
  @IsEnum(NotificationPriority, { message: 'Priority must be a valid notification priority' })
  @IsOptional()
  priority?: NotificationPriority;

  @ApiPropertyOptional({ 
    description: 'Related product ID',
    example: '507f1f77bcf86cd799439013',
  })
  @IsString({ message: 'Related product ID must be a string' })
  @IsMongoId({ message: 'Related product ID must be a valid MongoDB ObjectId' })
  @IsOptional()
  relatedProduct?: string;

  @ApiPropertyOptional({ 
    description: 'Related rental request ID',
    example: '507f1f77bcf86cd799439014',
  })
  @IsString({ message: 'Related rental request ID must be a string' })
  @IsMongoId({ message: 'Related rental request ID must be a valid MongoDB ObjectId' })
  @IsOptional()
  relatedRentalRequest?: string;

  @ApiPropertyOptional({ 
    description: 'Related message ID',
    example: '507f1f77bcf86cd799439015',
  })
  @IsString({ message: 'Related message ID must be a string' })
  @IsMongoId({ message: 'Related message ID must be a valid MongoDB ObjectId' })
  @IsOptional()
  relatedMessage?: string;

  @ApiPropertyOptional({ 
    description: 'Related order ID',
    example: '507f1f77bcf86cd799439016',
  })
  @IsString({ message: 'Related order ID must be a string' })
  @IsMongoId({ message: 'Related order ID must be a valid MongoDB ObjectId' })
  @IsOptional()
  relatedOrder?: string;

  @ApiPropertyOptional({ 
    description: 'Action URL for the notification',
    example: 'https://app.khetiwala.com/rental-requests/507f1f77bcf86cd799439014',
  })
  @IsString({ message: 'Action URL must be a string' })
  @IsUrl({}, { message: 'Action URL must be a valid URL' })
  @IsOptional()
  actionUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Expiration date for the notification',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsDateString({}, { message: 'Expiration date must be a valid date string' })
  @IsOptional()
  expiresAt?: Date;
}
