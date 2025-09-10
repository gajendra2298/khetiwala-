import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findUserByEmail(email);
    if (user && await this.usersService.validatePassword(password, user.password)) {
      const { password, ...result } = (user as UserDocument).toJSON();
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '7d';
    const payload = { email: user.email, sub: user._id, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn,
    });

    console.log('Login successful for user:', user.email);
    console.log('JWT token created with payload:', { email: user.email, sub: user._id, role: user.role });

    return {
      access_token: accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      expiresIn: this.parseExpiresIn(expiresIn),
    };
  }

  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.usersService.findUserByEmail(signupDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.usersService.createUser(signupDto);
    const { password, ...result } = (user as UserDocument).toJSON();
    
    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '7d';
    const payload = { email: user.email, sub: (user as UserDocument)._id, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn,
    });

    console.log('Signup successful for user:', user.email);
    console.log('JWT token created with payload:', { email: user.email, sub: (user as UserDocument)._id, role: user.role });

    return {
      access_token: accessToken,
      user: {
        _id: (user as UserDocument)._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      expiresIn: this.parseExpiresIn(expiresIn),
    };
  }

  async refreshToken(userId: string): Promise<{ access_token: string }> {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = { email: user.email, sub: (user as UserDocument)._id, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    return { access_token: accessToken };
  }

  /**
   * Parse JWT expiresIn string to seconds
   * @param expiresIn - JWT expiresIn string (e.g., '7d', '1h', '3600s')
   * @returns number of seconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600; // Default to 1 hour if parsing fails
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 3600; // Default to 1 hour
    }
  }
}
