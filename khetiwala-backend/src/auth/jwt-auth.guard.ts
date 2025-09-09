import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Add custom logic here if needed
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    // Debug logging
    console.log('JWT Auth Debug:');
    console.log('- Authorization header:', authHeader ? 'Present' : 'Missing');
    console.log('- Header value:', authHeader ? authHeader.substring(0, 20) + '...' : 'N/A');
    
    if (err) {
      console.log('JWT Auth Error:', err.message);
    }
    if (info) {
      console.log('JWT Auth Info:', info.message || info);
    }
    if (!user) {
      console.log('JWT Auth: No user found');
    }

    // Handle authentication errors
    if (err || !user) {
      let errorMessage = 'Invalid or expired token';
      
      if (info?.message === 'No auth token') {
        errorMessage = 'No auth token provided. Please include Authorization header with Bearer token.';
      } else if (info?.message === 'jwt malformed') {
        errorMessage = 'Malformed JWT token. Please check the token format.';
      } else if (info?.message === 'jwt expired') {
        errorMessage = 'JWT token has expired. Please login again.';
      } else if (info?.message === 'jwt not active') {
        errorMessage = 'JWT token is not active yet.';
      } else if (info?.message) {
        errorMessage = info.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      throw err || new UnauthorizedException(errorMessage);
    }
    return user;
  }
}
