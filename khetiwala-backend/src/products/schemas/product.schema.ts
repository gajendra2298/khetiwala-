import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

export enum ProductType {
  SALE = 'sale',
  RENT = 'rent',
  BOTH = 'both',
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  RENTED = 'rented',
  SOLD = 'sold',
}

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ min: 0 })
  rentalPrice?: number;

  @Prop({ required: true })
  image: string;

  @Prop({ type: [String], default: [] })
  additionalImages?: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: ProductType, 
    default: ProductType.SALE 
  })
  productType: ProductType;

  @Prop({ 
    type: String, 
    enum: ProductStatus, 
    default: ProductStatus.ACTIVE 
  })
  status: ProductStatus;

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ min: 0, default: 0 })
  quantity: number;

  @Prop({ trim: true })
  category?: string;

  @Prop({ trim: true })
  condition?: string; // new, used, excellent, good, fair

  @Prop({ type: Types.ObjectId, ref: 'Address' })
  location?: Types.ObjectId;

  @Prop({ default: 0 })
  rentalCount: number;

  @Prop({ default: 0 })
  viewCount: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes for better query performance
ProductSchema.index({ createdBy: 1, status: 1 });
ProductSchema.index({ productType: 1, status: 1 });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ isAvailable: 1, status: 1 });
