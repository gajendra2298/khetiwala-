import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AddressDocument = Address & Document;

@Schema({ timestamps: true })
export class Address {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, trim: true })
  phoneNumber: string;

  @Prop({ required: true, trim: true })
  addressLine1: string;

  @Prop({ trim: true })
  addressLine2?: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  state: string;

  @Prop({ required: true, trim: true })
  pincode: string;

  @Prop({ required: true, trim: true })
  country: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: 'home' })
  addressType: string; // home, work, other
}

export const AddressSchema = SchemaFactory.createForClass(Address);

// Index to ensure only one active address per user
AddressSchema.index({ userId: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });
