import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the uploaded file',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Public URL to access the uploaded file',
    example: 'https://api.khetiwala.com/uploads/images/507f1f77bcf86cd799439011.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Original filename of the uploaded file',
    example: 'product-image.jpg',
  })
  filename: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  size: number;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Upload timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  uploadedAt: string;
}
