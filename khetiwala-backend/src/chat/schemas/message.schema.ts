import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

export enum ChatType {
  USER_TO_USER = 'user_to_user',
  CUSTOMER_SUPPORT = 'customer_support',
  RENTAL_INQUIRY = 'rental_inquiry',
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiver: Types.ObjectId;

  @Prop({ required: true, trim: true })
  text: string;

  @Prop({ 
    type: String, 
    enum: MessageType, 
    default: MessageType.TEXT 
  })
  messageType: MessageType;

  @Prop({ 
    type: String, 
    enum: ChatType, 
    default: ChatType.USER_TO_USER 
  })
  chatType: ChatType;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt?: Date;

  @Prop({ trim: true })
  attachmentUrl?: string;

  @Prop({ trim: true })
  attachmentName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  relatedProduct?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RentalRequest' })
  relatedRentalRequest?: Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes for better query performance
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ chatType: 1, createdAt: -1 });
MessageSchema.index({ isRead: 1, receiver: 1 });
