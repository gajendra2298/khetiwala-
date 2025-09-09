import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { MessageType, ChatType } from './schemas/message.schema';

@WebSocketGateway({ 
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });
      const user = await this.usersService.findUserById(payload.sub);
      
      if (!user) {
        client.disconnect();
        return;
      }

      const userId = String((user as UserDocument)._id);
      
      // Track user connections
      this.connectedUsers.set(userId, client.id);
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      
      // Join user-specific room
      client.join(`user_${userId}`);
      
      // Join general rooms
      client.join('general');
      client.join(`user_${userId}`);
      
      // Notify user about connection
      client.emit('connected', { 
        message: 'Connected successfully',
        userId,
        user: { name: user.name, email: user.email }
      });
      
      // Notify others about user coming online
      client.to('general').emit('userOnline', { 
        userId, 
        user: { name: user.name, email: user.email } 
      });
      
      console.log(`User ${user.name} connected with socket ${client.id}`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketIds] of this.userSockets.entries()) {
      if (socketIds.has(client.id)) {
        socketIds.delete(client.id);
        
        // If user has no more connections, remove from connected users
        if (socketIds.size === 0) {
          this.connectedUsers.delete(userId);
          this.userSockets.delete(userId);
          
          // Notify others about user going offline
          this.server.to('general').emit('userOffline', { userId });
        }
        
        console.log(`User ${userId} disconnected socket ${client.id}`);
        break;
      }
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() data: CreateMessageDto, @ConnectedSocket() client: Socket) {
    try {
      const { recipientId, content, messageType, chatType, attachmentUrl, attachmentName, relatedProduct, relatedRentalRequest } = data;
      
      // Get sender from connected users
      let senderId: string | null = null;
      for (const [userId, socketIds] of this.userSockets.entries()) {
        if (socketIds.has(client.id)) {
          senderId = userId;
          break;
        }
      }

      if (!senderId) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      const message = await this.chatService.createMessage({
        sender: senderId,
        recipientId,
        content,
        messageType: messageType || MessageType.TEXT,
        chatType: chatType || ChatType.USER_TO_USER,
        attachmentUrl,
        attachmentName,
        relatedProduct,
        relatedRentalRequest,
      });

      // Create notification for the receiver
      if (recipientId && recipientId !== senderId) {
        try {
          await this.notificationsService.createNewMessageNotification(
            recipientId,
            senderId,
            String((message as any)._id),
            content
          );
        } catch (error) {
          console.error('Error creating notification:', error);
        }
      }

      // Emit to receiver if online
      if (recipientId) {
        const receiverSockets = this.userSockets.get(recipientId);
        if (receiverSockets && receiverSockets.size > 0) {
          this.server.to(`user_${recipientId}`).emit('receiveMessage', message);
        }
      } else {
        // Broadcast to all connected users for group messages
        this.server.to('general').emit('receiveMessage', message);
      }

      // Emit back to sender for confirmation
      client.emit('messageSent', message);
      
      // Emit typing stop
      if (recipientId) {
        this.server.to(`user_${recipientId}`).emit('stopTyping', { senderId });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.join(room);
    console.log(`Client ${client.id} joined room ${room}`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.leave(room);
    console.log(`Client ${client.id} left room ${room}`);
  }

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    const onlineUserIds = Array.from(this.connectedUsers.keys());
    client.emit('onlineUsers', onlineUserIds);
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: { recipientId: string; isTyping: boolean }, @ConnectedSocket() client: Socket) {
    let senderId: string | null = null;
    for (const [userId, socketIds] of this.userSockets.entries()) {
      if (socketIds.has(client.id)) {
        senderId = userId;
        break;
      }
    }

    if (senderId && data.recipientId) {
      this.server.to(`user_${data.recipientId}`).emit('typing', {
        senderId,
        isTyping: data.isTyping,
      });
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(@MessageBody() data: { messageId: string }, @ConnectedSocket() client: Socket) {
    try {
      let userId: string | null = null;
      for (const [user, socketIds] of this.userSockets.entries()) {
        if (socketIds.has(client.id)) {
          userId = user;
          break;
        }
      }

      if (userId) {
        await this.chatService.markMessageAsRead(data.messageId, userId);
        client.emit('messageRead', { messageId: data.messageId });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      client.emit('error', { message: 'Failed to mark message as read' });
    }
  }

  @SubscribeMessage('getConversation')
  async handleGetConversation(@MessageBody() data: { otherUserId: string }, @ConnectedSocket() client: Socket) {
    try {
      let userId: string | null = null;
      for (const [user, socketIds] of this.userSockets.entries()) {
        if (socketIds.has(client.id)) {
          userId = user;
          break;
        }
      }

      if (userId) {
        const messages = await this.chatService.getConversation(userId, data.otherUserId);
        client.emit('conversation', messages);
      }
    } catch (error) {
      console.error('Error getting conversation:', error);
      client.emit('error', { message: 'Failed to get conversation' });
    }
  }

  @SubscribeMessage('joinChatRoom')
  handleJoinChatRoom(@MessageBody() data: { roomId: string; roomType: string }, @ConnectedSocket() client: Socket) {
    const roomName = `${data.roomType}_${data.roomId}`;
    client.join(roomName);
    client.emit('joinedRoom', { room: roomName });
    console.log(`Client ${client.id} joined chat room ${roomName}`);
  }

  @SubscribeMessage('leaveChatRoom')
  handleLeaveChatRoom(@MessageBody() data: { roomId: string; roomType: string }, @ConnectedSocket() client: Socket) {
    const roomName = `${data.roomType}_${data.roomId}`;
    client.leave(roomName);
    client.emit('leftRoom', { room: roomName });
    console.log(`Client ${client.id} left chat room ${roomName}`);
  }

  // Method to send notification to specific user
  sendNotificationToUser(userId: string, notification: any) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets && userSockets.size > 0) {
      this.server.to(`user_${userId}`).emit('notification', notification);
    }
  }

  // Method to broadcast notification to all users
  broadcastNotification(notification: any) {
    this.server.to('general').emit('notification', notification);
  }

  // Method to send rental request notification
  async sendRentalRequestNotification(ownerId: string, requesterId: string, productId: string, rentalRequestId: string) {
    try {
      const notification = await this.notificationsService.createRentalRequestNotification(
        ownerId,
        requesterId,
        productId,
        rentalRequestId
      );
      
      this.sendNotificationToUser(ownerId, notification);
    } catch (error) {
      console.error('Error sending rental request notification:', error);
    }
  }

  // Method to send rental status update notification
  async sendRentalStatusNotification(userId: string, status: string, productId: string, rentalRequestId: string) {
    try {
      let notification;
      if (status === 'approved') {
        notification = await this.notificationsService.createRentalApprovedNotification(
          userId,
          '', // ownerId - would need to be passed
          productId,
          rentalRequestId
        );
      } else if (status === 'rejected') {
        notification = await this.notificationsService.createRentalRejectedNotification(
          userId,
          '', // ownerId - would need to be passed
          productId,
          rentalRequestId
        );
      }
      
      if (notification) {
        this.sendNotificationToUser(userId, notification);
      }
    } catch (error) {
      console.error('Error sending rental status notification:', error);
    }
  }
}
