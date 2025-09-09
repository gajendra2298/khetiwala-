import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  FARMER = 'farmer',
  SUPPORT = 'support',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ 
    type: String, 
    enum: UserRole, 
    default: UserRole.FARMER 
  })
  role: UserRole;

  @Prop({ 
    required: false, 
    trim: true,
    sparse: true // This allows multiple null values but ensures uniqueness for non-null values
  })
  phone?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
