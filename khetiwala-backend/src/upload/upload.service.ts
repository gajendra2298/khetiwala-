import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Upload, UploadDocument } from './schemas/upload.schema';
import { UploadResponseDto } from './dto/upload-response.dto';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly uploadPath: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(
    @InjectModel(Upload.name) private uploadModel: Model<UploadDocument>,
    private configService: ConfigService,
  ) {
    this.uploadPath = path.join(process.cwd(), 'uploads', 'images');
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async uploadImage(file: Express.Multer.File, userId: string): Promise<UploadResponseDto> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(this.uploadPath, uniqueFilename);

      // Save file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Generate public URL
      const baseUrl = this.configService.get<string>('app.baseUrl') || 'http://192.168.1.9:5000';
      const publicUrl = `${baseUrl}/uploads/images/${uniqueFilename}`;

      // Save file info to database
      const upload = new this.uploadModel({
        filename: uniqueFilename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: filePath,
        url: publicUrl,
        uploadedBy: userId,
        category: 'image',
      });

      const savedUpload = await upload.save();

      return {
        id: savedUpload._id.toString(),
        url: publicUrl,
        filename: uniqueFilename,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: savedUpload.createdAt.toISOString(),
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
    }
  }

  async getUploadById(id: string): Promise<UploadDocument | null> {
    return this.uploadModel.findById(id).exec();
  }

  async deleteUpload(id: string, userId: string): Promise<boolean> {
    try {
      const upload = await this.uploadModel.findOne({ _id: id, uploadedBy: userId });
      if (!upload) {
        return false;
      }

      // Delete file from disk
      if (fs.existsSync(upload.path)) {
        fs.unlinkSync(upload.path);
      }

      // Delete from database
      await this.uploadModel.findByIdAndDelete(id);
      return true;
    } catch (error) {
      console.error('Error deleting upload:', error);
      return false;
    }
  }

  async getUserUploads(userId: string): Promise<UploadDocument[]> {
    return this.uploadModel.find({ uploadedBy: userId, isActive: true }).exec();
  }
}
