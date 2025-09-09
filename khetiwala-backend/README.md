# Khetiwala Backend API

A comprehensive NestJS-based backend API for agricultural marketplace management with real-time chat functionality.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete user CRUD operations with role management
- **Product Management**: Full product lifecycle management
- **Order Management**: Order processing and status tracking
- **Real-time Chat**: WebSocket-based messaging system
- **API Documentation**: Swagger/OpenAPI documentation
- **Security**: Helmet, CORS, rate limiting, input validation
- **Database Seeding**: Pre-populated data for development
- **Error Handling**: Comprehensive error handling and logging

## 🛠️ Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with Passport
- **Real-time**: Socket.IO
- **Documentation**: Swagger/OpenAPI
- **Validation**: Class-validator & Class-transformer
- **Security**: Helmet, bcrypt, rate limiting
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd khetiwala-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database
   MONGO_URI=mongodb://127.0.0.1:27017/khetiwala
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES=7d
   JWT_REFRESH_SECRET=your-refresh-secret-key-here
   JWT_REFRESH_EXPIRES=30d
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   
   # Rate Limiting
   RATE_LIMIT_TTL=60
   RATE_LIMIT_MAX=100
   
   # Bcrypt Configuration
   BCRYPT_SALT_ROUNDS=12
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system:
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Seed the Database** (Optional)
   ```bash
   npm run seed
   ```

6. **Start the Development Server**
   ```bash
   npm run start:dev
   ```

## 📚 API Documentation

Once the server is running, you can access the Swagger documentation at:
- **Local**: http://localhost:5000/api/docs

## 🔐 Authentication

The API uses JWT-based authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Default Users (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@khetiwala.com | password123 |
| Support | support@khetiwala.com | password123 |
| Farmer | rajesh@farmer.com | password123 |
| Customer | customer1@example.com | password123 |

## 🏗️ Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── dto/                # Data Transfer Objects
│   ├── auth.controller.ts  # Auth endpoints
│   ├── auth.service.ts     # Auth business logic
│   ├── jwt.strategy.ts     # JWT strategy
│   └── jwt-auth.guard.ts   # JWT guard
├── users/                  # User management
│   ├── dto/               # User DTOs
│   ├── schemas/           # User schema
│   ├── users.controller.ts
│   └── users.service.ts
├── products/              # Product management
│   ├── dto/              # Product DTOs
│   ├── schemas/          # Product schema
│   ├── products.controller.ts
│   └── products.service.ts
├── orders/               # Order management
│   ├── dto/             # Order DTOs
│   ├── schemas/         # Order schema
│   ├── orders.controller.ts
│   └── orders.service.ts
├── chat/                # Real-time messaging
│   ├── dto/            # Chat DTOs
│   ├── schemas/        # Message schema
│   ├── chat.gateway.ts # WebSocket gateway
│   └── chat.service.ts
├── common/              # Shared utilities
│   ├── decorators/     # Custom decorators
│   ├── exceptions/     # Custom exceptions
│   ├── filters/        # Exception filters
│   ├── guards/         # Custom guards
│   └── interceptors/   # Response interceptors
├── config/             # Configuration
├── database/           # Database utilities
│   └── seeds/         # Database seeding
└── main.ts            # Application entry point
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /auth/refresh` - Refresh token
- `GET /auth/profile` - Get current user profile

### Users
- `GET /users` - Get all users (Admin only)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (Admin only)

### Products
- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create product (Authenticated)
- `PUT /products/:id` - Update product (Owner/Admin)
- `DELETE /products/:id` - Delete product (Owner/Admin)

### Orders
- `GET /orders` - Get user orders
- `GET /orders/:id` - Get order by ID
- `POST /orders` - Create order (Authenticated)
- `PUT /orders/:id` - Update order status (Admin/Support)

### Chat
- `GET /chat/messages` - Get chat messages
- WebSocket: `/chat` - Real-time messaging

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API rate limiting
- **Input Validation**: Request validation
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt password hashing
- **Role-based Access**: Role-based authorization

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start:prod
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["node", "dist/main"]
```

### Environment Variables for Production
```env
NODE_ENV=production
MONGO_URI=mongodb://your-production-mongo-uri
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

## 📝 Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build the application
- `npm run start:prod` - Start production server
- `npm run seed` - Seed the database with initial data
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/api/docs`

## 🔄 Changelog

### v1.0.0
- Initial release
- Authentication system
- User, Product, Order management
- Real-time chat
- API documentation
- Database seeding
- Security enhancements