import { ApiProperty } from '@nestjs/swagger';
import { NotificationType, NotificationPriority } from '../schemas/notification.schema';

export class NotificationResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  fromUser?: {
    _id: string;
    name: string;
    email: string;
  };

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ enum: NotificationPriority })
  priority: NotificationPriority;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  readAt?: Date;

  @ApiProperty()
  relatedProduct?: {
    _id: string;
    title: string;
    image: string;
  };

  @ApiProperty()
  relatedRentalRequest?: {
    _id: string;
    status: string;
  };

  @ApiProperty()
  relatedMessage?: {
    _id: string;
    text: string;
  };

  @ApiProperty()
  relatedOrder?: {
    _id: string;
    status: string;
  };

  @ApiProperty()
  actionUrl?: string;

  @ApiProperty()
  isDeleted: boolean;

  @ApiProperty()
  expiresAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
