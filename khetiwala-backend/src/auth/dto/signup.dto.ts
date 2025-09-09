import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  MinLength, 
  MaxLength, 
  IsOptional, 
  IsEnum, 
  Matches,
  IsStrongPassword,
  Length
} from 'class-validator';
import { UserRole } from '../../users/schemas/user.schema';

export class SignupDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @Length(2, 50, { message: 'Name must be between 2 and 50 characters' })
  @Matches(/^[a-zA-Z\s]+$/, { message: 'Name can only contain letters and spaces' })
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'farmer@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(100, { message: 'Email must not exceed 100 characters' })
  email: string;

  @ApiProperty({
    description: 'User password - must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character',
    example: 'Password123!',
    minLength: 8,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character' }
  )
  password: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+919876543210',
  })
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^(\+91|91)?[6-9]\d{9}$/, { message: 'Please provide a valid Indian phone number' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    example: UserRole.FARMER,
    default: UserRole.FARMER,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be a valid user role (farmer, support, admin)' })
  role?: UserRole;
}
