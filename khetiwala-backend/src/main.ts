import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Security middleware
  app.use(helmet());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validateCustomDecorators: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:19006',
      'http://192.168.1.9:3000',
      'http://192.168.1.9:19006',
      'http://192.168.1.3:3000',
      'http://192.168.1.3:19006',
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // Allow any local network IP
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/, // Allow 10.x.x.x network
      /^http:\/\/172\.\d+\.\d+\.\d+:\d+$/, // Allow 172.x.x.x network
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Khetiwala API')
    .setDescription('A comprehensive API for agricultural marketplace management')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management operations')
    .addTag('Products', 'Product management operations')
    .addTag('Orders', 'Order management operations')
    .addTag('Chat', 'Real-time messaging operations')
    .addTag('addresses', 'Address management operations')
    .addTag('cart', 'Shopping cart operations')
    .addTag('rental-requests', 'Rental request management operations')
    .addTag('notifications', 'Notification management operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get<number>('port') || 5000;
  const host = '0.0.0.0'; // Listen on all network interfaces
  await app.listen(port, host);
  
  logger.log(`🚀 Khetiwala Backend is running on: http://${host}:${port}`);
  logger.log(`📚 API Documentation available at: http://${host}:${port}/docs`);
  logger.log(`🌐 Mobile access: http://192.168.1.9:${port}`);
}
bootstrap();
