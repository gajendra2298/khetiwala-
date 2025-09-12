import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument, MessageType, ChatType } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
  ) {}

  async createMessage(createMessageDto: CreateMessageDto & { sender: string }): Promise<Message> {
    const message = new this.messageModel({
      sender: new Types.ObjectId(createMessageDto.sender),
      receiver: createMessageDto.recipientId ? new Types.ObjectId(createMessageDto.recipientId) : undefined,
      text: createMessageDto.content,
      messageType: createMessageDto.messageType || MessageType.TEXT,
      chatType: createMessageDto.chatType || ChatType.USER_TO_USER,
      attachmentUrl: createMessageDto.attachmentUrl,
      attachmentName: createMessageDto.attachmentName,
      relatedProduct: createMessageDto.relatedProduct ? new Types.ObjectId(createMessageDto.relatedProduct) : undefined,
      relatedRentalRequest: createMessageDto.relatedRentalRequest ? new Types.ObjectId(createMessageDto.relatedRentalRequest) : undefined,
    });

    return message.save();
  }

  async getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
    return this.messageModel
      .find({
        $or: [
          { sender: new Types.ObjectId(userId1), receiver: new Types.ObjectId(userId2) },
          { sender: new Types.ObjectId(userId2), receiver: new Types.ObjectId(userId1) },
        ],
      })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .sort({ createdAt: 1 })
      .exec();
  }

  async getConversationsForUser(userId: string): Promise<Message[]> {
    return this.messageModel
      .find({
        $or: [
          { sender: new Types.ObjectId(userId) },
          { receiver: new Types.ObjectId(userId) },
        ],
      })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<Message> {
    return this.messageModel
      .findOneAndUpdate(
        { 
          _id: new Types.ObjectId(messageId), 
          receiver: new Types.ObjectId(userId) 
        },
        { 
          isRead: true, 
          readAt: new Date() 
        },
        { new: true }
      )
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .exec() as Promise<Message>;
  }

  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    return this.messageModel
      .find({
        $or: [
          { sender: new Types.ObjectId(userId1), receiver: new Types.ObjectId(userId2) },
          { sender: new Types.ObjectId(userId2), receiver: new Types.ObjectId(userId1) },
        ],
        isDeleted: false,
      })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .populate('relatedProduct', 'title image')
      .populate('relatedRentalRequest', 'status')
      .sort({ createdAt: 1 })
      .exec();
  }

  async getUnreadMessagesCount(userId: string): Promise<number> {
    return this.messageModel
      .countDocuments({
        receiver: new Types.ObjectId(userId),
        isRead: false,
        isDeleted: false,
      })
      .exec();
  }

  async getMessages(userId: string, recipientId?: string, limit?: number, offset?: number): Promise<Message[]> {
    const query: any = {
      $or: [
        { sender: new Types.ObjectId(userId) },
        { receiver: new Types.ObjectId(userId) },
      ],
      isDeleted: false,
    };

    if (recipientId) {
      query.$or = [
        { sender: new Types.ObjectId(userId), receiver: new Types.ObjectId(recipientId) },
        { sender: new Types.ObjectId(recipientId), receiver: new Types.ObjectId(userId) },
      ];
    }

    let queryBuilder = this.messageModel
      .find(query)
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .populate('relatedProduct', 'title image')
      .populate('relatedRentalRequest', 'status')
      .sort({ createdAt: -1 });

    if (limit) {
      queryBuilder = queryBuilder.limit(limit);
    }
    if (offset) {
      queryBuilder = queryBuilder.skip(offset);
    }

    return queryBuilder.exec();
  }

  async getConversations(userId: string): Promise<any[]> {
    const conversations = await this.messageModel.aggregate([
      {
        $match: {
          $or: [
            { sender: new Types.ObjectId(userId) },
            { receiver: new Types.ObjectId(userId) },
          ],
          isDeleted: false,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', new Types.ObjectId(userId)] },
              '$receiver',
              '$sender',
            ],
          },
          lastMessage: { $first: '$text' },
          lastMessageTime: { $first: '$createdAt' },
          lastMessageType: { $first: '$messageType' },
          chatType: { $first: '$chatType' },
          relatedProduct: { $first: '$relatedProduct' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', new Types.ObjectId(userId)] },
                    { $ne: ['$isRead', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $lookup: {
          from: 'products',
          localField: 'relatedProduct',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userEmail: '$user.email',
          lastMessage: 1,
          lastMessageTime: 1,
          lastMessageType: 1,
          chatType: 1,
          relatedProduct: 1,
          product: { $arrayElemAt: ['$product', 0] },
          unreadCount: 1,
        },
      },
    ]);

    return conversations;
  }

  /**
   * Get conversations related to orders (buyer-seller chats)
   */
  async getOrderRelatedConversations(userId: string): Promise<any[]> {
    const conversations = await this.messageModel.aggregate([
      {
        $match: {
          $or: [
            { sender: new Types.ObjectId(userId) },
            { receiver: new Types.ObjectId(userId) },
          ],
          isDeleted: false,
          relatedProduct: { $exists: true, $ne: null },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', new Types.ObjectId(userId)] },
              '$receiver',
              '$sender',
            ],
          },
          lastMessage: { $first: '$text' },
          lastMessageTime: { $first: '$createdAt' },
          lastMessageType: { $first: '$messageType' },
          chatType: { $first: '$chatType' },
          relatedProduct: { $first: '$relatedProduct' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', new Types.ObjectId(userId)] },
                    { $ne: ['$isRead', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $lookup: {
          from: 'products',
          localField: 'relatedProduct',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userEmail: '$user.email',
          lastMessage: 1,
          lastMessageTime: 1,
          lastMessageType: 1,
          chatType: 1,
          relatedProduct: 1,
          product: { $arrayElemAt: ['$product', 0] },
          unreadCount: 1,
        },
      },
    ]);

    return conversations;
  }
}
