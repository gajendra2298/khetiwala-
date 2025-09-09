import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../users/schemas/user.schema';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('jwt.secret') || 'supersecret';
    console.log('JWT Strategy initialized with secret:', secret ? '***' : 'NOT SET');
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    console.log('JWT Strategy validate called with payload:', {
      sub: payload?.sub,
      email: payload?.email,
      role: payload?.role
    });
    
    // Validate that the payload has the required fields
    if (!payload || !payload.sub || !payload.email) {
      console.log('JWT Strategy: Invalid payload - missing sub or email');
      throw new Error('Invalid token payload');
    }
    
    console.log('JWT Strategy: Token validated successfully for user:', payload.email);
    
    return { 
      userId: payload.sub, // Use userId for consistency
      sub: payload.sub, 
      email: payload.email, 
      role: payload.role,
      id: payload.sub,
    };
  }
}
