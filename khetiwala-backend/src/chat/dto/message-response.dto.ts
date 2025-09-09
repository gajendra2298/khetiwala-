import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class MessageResponseDto {
  @ApiProperty({
    description: 'Message ID',
    example: '507f1f77bcf86cd799439011',
  })
  _id: any;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello, I need help with my order',
  })
  content: string;

  @ApiProperty({
    description: 'ID of the user who sent the message',
    example: '507f1f77bcf86cd799439011',
  })
  sender: Types.ObjectId;

  @ApiProperty({
    description: 'ID of the recipient user (optional for group messages)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  recipient?: Types.ObjectId;

  @ApiProperty({
    description: 'Message creation date',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Message last update date',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}
