import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RentalRequestDocument = RentalRequest & Document;

export enum RentalRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  RETURNED = 'returned',
}

@Schema({ timestamps: true })
export class RentalRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requester: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Address', required: true })
  deliveryAddress: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true, min: 1 })
  rentalDays: number;

  @Prop({ required: true, min: 0 })
  dailyRate: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ 
    type: String, 
    enum: RentalRequestStatus, 
    default: RentalRequestStatus.PENDING 
  })
  status: RentalRequestStatus;

  @Prop({ trim: true })
  message?: string;

  @Prop({ trim: true })
  rejectionReason?: string;

  @Prop()
  approvedAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  returnedAt?: Date;

  @Prop({ default: false })
  isDelivered: boolean;

  @Prop({ default: false })
  isReturned: boolean;

  @Prop({ trim: true })
  deliveryNotes?: string;

  @Prop({ trim: true })
  returnNotes?: string;

  @Prop({ default: 0 })
  rating?: number;

  @Prop({ trim: true })
  review?: string;
}

export const RentalRequestSchema = SchemaFactory.createForClass(RentalRequest);

// Indexes for better query performance
RentalRequestSchema.index({ requester: 1, status: 1 });
RentalRequestSchema.index({ owner: 1, status: 1 });
RentalRequestSchema.index({ product: 1, status: 1 });
RentalRequestSchema.index({ status: 1, createdAt: -1 });
