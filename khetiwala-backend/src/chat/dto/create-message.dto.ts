import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  MaxLength, 
  IsOptional, 
  IsEnum, 
  IsMongoId, 
  IsUrl,
  Length,
  MinLength
} from 'class-validator';
import { MessageType, ChatType } from '../schemas/message.schema';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Message content',
    example: 'Hello, I need help with my order',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString({ message: 'Message must be a string' })
  @IsNotEmpty({ message: 'Message content is required' })
  @MinLength(1, { message: 'Message content cannot be empty' })
  @MaxLength(2000, { message: 'Message must not exceed 2000 characters' })
  content: string;

  @ApiProperty({
    description: 'Recipient user ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString({ message: 'Recipient ID must be a string' })
  @IsNotEmpty({ message: 'Recipient ID is required' })
  @IsMongoId({ message: 'Recipient ID must be a valid MongoDB ObjectId' })
  recipientId: string;

  @ApiPropertyOptional({
    description: 'Message type',
    enum: MessageType,
    default: MessageType.TEXT,
    example: MessageType.TEXT,
  })
  @IsEnum(MessageType, { message: 'Message type must be a valid message type' })
  @IsOptional()
  messageType?: MessageType;

  @ApiPropertyOptional({
    description: 'Chat type',
    enum: ChatType,
    default: ChatType.USER_TO_USER,
    example: ChatType.USER_TO_USER,
  })
  @IsEnum(ChatType, { message: 'Chat type must be a valid chat type' })
  @IsOptional()
  chatType?: ChatType;

  @ApiPropertyOptional({ 
    description: 'Attachment URL',
    example: 'https://example.com/file.pdf',
  })
  @IsString({ message: 'Attachment URL must be a string' })
  @IsUrl({}, { message: 'Attachment URL must be a valid URL' })
  @IsOptional()
  attachmentUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Attachment name',
    example: 'document.pdf',
    maxLength: 255,
  })
  @IsString({ message: 'Attachment name must be a string' })
  @Length(1, 255, { message: 'Attachment name must be between 1 and 255 characters' })
  @IsOptional()
  attachmentName?: string;

  @ApiPropertyOptional({ 
    description: 'Related product ID',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString({ message: 'Related product ID must be a string' })
  @IsMongoId({ message: 'Related product ID must be a valid MongoDB ObjectId' })
  @IsOptional()
  relatedProduct?: string;

  @ApiPropertyOptional({ 
    description: 'Related rental request ID',
    example: '507f1f77bcf86cd799439013',
  })
  @IsString({ message: 'Related rental request ID must be a string' })
  @IsMongoId({ message: 'Related rental request ID must be a valid MongoDB ObjectId' })
  @IsOptional()
  relatedRentalRequest?: string;
}
