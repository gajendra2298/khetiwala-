import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(ThrottlerGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async sendMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Request() req: any,
  ): Promise<MessageResponseDto> {
    return this.chatService.createMessage({
      ...createMessageDto,
      sender: req.user.sub,
    }) as any;
  }

  @Get('messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get chat messages' })
  @ApiQuery({
    name: 'recipientId',
    description: 'Recipient user ID (optional for group messages)',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of messages to retrieve',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Number of messages to skip',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
    type: [MessageResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getMessages(
    @Request() req: any,
    @Query('recipientId') recipientId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<MessageResponseDto[]> {
    return this.chatService.getMessages(req.user.sub, recipientId, limit, offset) as any;
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user conversations' })
  @ApiResponse({
    status: 200,
    description: 'Conversations retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          userName: { type: 'string' },
          lastMessage: { type: 'string' },
          lastMessageTime: { type: 'string' },
          unreadCount: { type: 'number' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getConversations(@Request() req: any) {
    return this.chatService.getConversations(req.user.sub) as any;
  }
}
