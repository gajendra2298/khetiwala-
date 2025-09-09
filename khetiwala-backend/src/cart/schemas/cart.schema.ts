import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartDocument = Cart & Document & {
  _id: Types.ObjectId;
  save(): Promise<CartDocument>;
};

export type CartItemDocument = CartItem & Document & {
  _id: Types.ObjectId;
};

export enum CartItemType {
  SALE = 'sale',
  RENT = 'rent',
}

@Schema({ timestamps: true })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ 
    type: String, 
    enum: CartItemType, 
    default: CartItemType.SALE 
  })
  itemType: CartItemType;

  @Prop()
  rentalStartDate?: Date;

  @Prop()
  rentalEndDate?: Date;

  @Prop({ min: 0 })
  rentalDays?: number;
}

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: [CartItem], default: [] })
  items: CartItem[];

  @Prop({ default: 0 })
  totalItems: number;

  @Prop({ default: 0 })
  totalPrice: number;

  @Prop({ default: 0 })
  totalRentalPrice: number;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);
export const CartSchema = SchemaFactory.createForClass(Cart);
