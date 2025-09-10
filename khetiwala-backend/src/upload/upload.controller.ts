import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';
import { UploadResponseDto } from './dto/upload-response.dto';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload an image file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or file too large',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    return this.uploadService.uploadImage(file, req.user.sub);
  }

  @Get('my-uploads')
  @ApiOperation({ summary: 'Get current user uploads' })
  @ApiResponse({
    status: 200,
    description: 'User uploads retrieved successfully',
    type: [UploadResponseDto],
  })
  async getMyUploads(@Request() req: any): Promise<UploadResponseDto[]> {
    const uploads = await this.uploadService.getUserUploads(req.user.sub);
    return uploads.map(upload => ({
      id: upload._id.toString(),
      url: upload.url,
      filename: upload.filename,
      size: upload.size,
      mimeType: upload.mimeType,
      uploadedAt: upload.createdAt.toISOString(),
    }));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an uploaded file' })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async deleteUpload(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    const deleted = await this.uploadService.deleteUpload(id, req.user.sub);
    
    if (!deleted) {
      throw new BadRequestException('File not found or you do not have permission to delete it');
    }

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }
}
