import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  RENTAL_REQUEST = 'rental_request',
  RENTAL_APPROVED = 'rental_approved',
  RENTAL_REJECTED = 'rental_rejected',
  RENTAL_COMPLETED = 'rental_completed',
  RENTAL_RETURNED = 'rental_returned',
  NEW_MESSAGE = 'new_message',
  PRODUCT_VIEWED = 'product_viewed',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  ORDER_UPDATE = 'order_update',
  CUSTOMER_SUPPORT = 'customer_support',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  fromUser?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ 
    type: String, 
    enum: NotificationType, 
    required: true 
  })
  type: NotificationType;

  @Prop({ 
    type: String, 
    enum: NotificationPriority, 
    default: NotificationPriority.MEDIUM 
  })
  priority: NotificationPriority;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  relatedProduct?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RentalRequest' })
  relatedRentalRequest?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  relatedMessage?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  relatedOrder?: Types.ObjectId;

  @Prop({ trim: true })
  actionUrl?: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop()
  expiresAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for better query performance
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ priority: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
