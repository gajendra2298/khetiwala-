import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  IsUrl, 
  Min, 
  Max, 
  MaxLength, 
  IsOptional, 
  IsEnum, 
  IsBoolean, 
  IsArray,
  ArrayMaxSize,
  Length,
  Matches,
  IsMongoId
} from 'class-validator';
import { ProductType } from '../schemas/product.schema';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product title',
    example: 'Organic Tomatoes',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @Length(3, 100, { message: 'Title must be between 3 and 100 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_.,!()]+$/, { message: 'Title can only contain letters, numbers, spaces, and basic punctuation' })
  title: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Fresh organic tomatoes grown without pesticides',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @Length(10, 1000, { message: 'Description must be between 10 and 1000 characters' })
  description: string;

  @ApiProperty({
    description: 'Product price in INR',
    example: 150.50,
    minimum: 0.01,
    maximum: 1000000,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Price must be a number with maximum 2 decimal places' })
  @Min(0.01, { message: 'Price must be greater than 0' })
  @Max(1000000, { message: 'Price must not exceed 10,00,000 INR' })
  price: number;

  @ApiPropertyOptional({
    description: 'Rental price per day in INR',
    example: 25.00,
    minimum: 0.01,
    maximum: 10000,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Rental price must be a number with maximum 2 decimal places' })
  @Min(0.01, { message: 'Rental price must be greater than 0' })
  @Max(10000, { message: 'Rental price must not exceed 10,000 INR per day' })
  @IsOptional()
  rentalPrice?: number;

  @ApiProperty({
    description: 'Product image URL',
    example: 'https://example.com/tomatoes.jpg',
  })
  @IsString({ message: 'Image must be a string' })
  @IsNotEmpty({ message: 'Image URL is required' })
  @Matches(/^https?:\/\/.+/, { message: 'Please provide a valid image URL starting with http:// or https://' })
  image: string;

  @ApiPropertyOptional({
    description: 'Additional product images (maximum 5 images)',
    example: ['https://example.com/tomatoes2.jpg', 'https://example.com/tomatoes3.jpg'],
    type: [String],
    maxItems: 5,
  })
  @IsArray()
  @Matches(/^https?:\/\/.+/, { each: true, message: 'Each image must be a valid URL starting with http:// or https://' })
  @ArrayMaxSize(5, { message: 'Maximum 5 additional images allowed' })
  @IsOptional()
  additionalImages?: string[];

  @ApiPropertyOptional({
    description: 'Product type',
    enum: ProductType,
    default: ProductType.SALE,
  })
  @IsEnum(ProductType, { message: 'Product type must be sale, rent, or both' })
  @IsOptional()
  productType?: ProductType;

  @ApiPropertyOptional({
    description: 'Product availability',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Product quantity',
    example: 10,
    minimum: 1,
    maximum: 10000,
    default: 1,
  })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(10000, { message: 'Quantity must not exceed 10,000' })
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Product category',
    example: 'Vegetables',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'Category must be between 2 and 50 characters' })
  @Matches(/^[a-zA-Z\s]+$/, { message: 'Category can only contain letters and spaces' })
  category?: string;

  @ApiPropertyOptional({
    description: 'Product condition',
    example: 'new',
    enum: ['new', 'used', 'excellent', 'good', 'fair'],
  })
  @IsOptional()
  @IsString()
  @Matches(/^(new|used|excellent|good|fair)$/, { message: 'Condition must be one of: new, used, excellent, good, fair' })
  condition?: string;

  @ApiPropertyOptional({
    description: 'Address ID for product location (required for rental products)',
  })
  @IsOptional()
  @IsString()
  @IsMongoId({ message: 'Location must be a valid MongoDB ObjectId' })
  location?: string;
}
