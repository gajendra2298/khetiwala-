import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../users/schemas/user.schema';
import { Product } from '../../products/schemas/product.schema';
import { Order, OrderStatus } from '../../orders/schemas/order.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private configService: ConfigService,
  ) {}

  async seedDatabase(): Promise<void> {
    try {
      this.logger.log('Starting database seeding...');

      // Clear existing data
      await this.clearDatabase();

      // Seed users
      const users = await this.seedUsers();

      // Seed products
      const products = await this.seedProducts(users);

      // Seed orders
      await this.seedOrders(users, products);

      this.logger.log('Database seeding completed successfully!');
    } catch (error) {
      this.logger.error('Error seeding database:', error);
      throw error;
    }
  }

  private async clearDatabase(): Promise<void> {
    await this.userModel.deleteMany({});
    await this.productModel.deleteMany({});
    await this.orderModel.deleteMany({});
    this.logger.log('Cleared existing data');
  }

  private async seedUsers(): Promise<User[]> {
    const saltRounds = this.configService.get<number>('bcrypt.saltRounds') || 12;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);

    const usersData = [
      {
        name: 'Admin User',
        email: 'admin@khetiwala.com',
        password: hashedPassword,
        role: UserRole.ADMIN,
      },
      {
        name: 'Support Agent',
        email: 'support@khetiwala.com',
        password: hashedPassword,
        role: UserRole.SUPPORT,
      },
      {
        name: 'Rajesh Kumar',
        email: 'rajesh@farmer.com',
        password: hashedPassword,
        role: UserRole.FARMER,
      },
      {
        name: 'Priya Sharma',
        email: 'priya@farmer.com',
        password: hashedPassword,
        role: UserRole.FARMER,
      },
      {
        name: 'Amit Singh',
        email: 'amit@farmer.com',
        password: hashedPassword,
        role: UserRole.FARMER,
      },
      {
        name: 'Customer One',
        email: 'customer1@example.com',
        password: hashedPassword,
        role: UserRole.FARMER,
      },
      {
        name: 'Customer Two',
        email: 'customer2@example.com',
        password: hashedPassword,
        role: UserRole.FARMER,
      },
    ];

    const users = await this.userModel.insertMany(usersData);
    this.logger.log(`Seeded ${users.length} users`);
    return users;
  }

  private async seedProducts(users: User[]): Promise<Product[]> {
    const farmers = users.filter(user => user.role === UserRole.FARMER);
    
    const productsData = [
      {
        title: 'Organic Tomatoes',
        description: 'Fresh organic tomatoes grown without pesticides. Perfect for salads and cooking.',
        price: 80,
        image: 'https://images.unsplash.com/photo-1546470427-5c4b4b4b4b4b?w=400',
        createdBy: (farmers[0] as any)._id,
      },
      {
        title: 'Fresh Spinach',
        description: 'Nutrient-rich spinach leaves, perfect for salads and smoothies.',
        price: 40,
        image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
        createdBy: (farmers[0] as any)._id,
      },
      {
        title: 'Organic Carrots',
        description: 'Sweet and crunchy organic carrots, rich in beta-carotene.',
        price: 60,
        image: 'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=400',
        createdBy: (farmers[1] as any)._id,
      },
      {
        title: 'Fresh Bell Peppers',
        description: 'Colorful bell peppers in red, yellow, and green varieties.',
        price: 120,
        image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400',
        createdBy: (farmers[1] as any)._id,
      },
      {
        title: 'Organic Potatoes',
        description: 'Fresh organic potatoes, perfect for various cooking methods.',
        price: 50,
        image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400',
        createdBy: (farmers[2] as any)._id,
      },
      {
        title: 'Fresh Onions',
        description: 'Aromatic onions, essential for Indian cooking.',
        price: 35,
        image: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400',
        createdBy: (farmers[2] as any)._id,
      },
      {
        title: 'Organic Cucumber',
        description: 'Crisp and refreshing organic cucumbers, perfect for salads.',
        price: 45,
        image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400',
        createdBy: (farmers[0] as any)._id,
      },
      {
        title: 'Fresh Cabbage',
        description: 'Fresh green cabbage, great for stir-fries and salads.',
        price: 30,
        image: 'https://images.unsplash.com/photo-1582510003544-4ac00f3f1f6f?w=400',
        createdBy: (farmers[1] as any)._id,
      },
    ];

    const products = await this.productModel.insertMany(productsData);
    this.logger.log(`Seeded ${products.length} products`);
    return products;
  }

  private async seedOrders(users: User[], products: Product[]): Promise<void> {
    const customers = users.filter(user => 
      user.email.includes('customer') || user.role === UserRole.FARMER
    );

    const ordersData = [
      {
        user: (customers[0] as any)._id,
        products: [
          {
            product: (products[0] as any)._id,
            quantity: 2,
            price: products[0].price,
          },
          {
            product: (products[1] as any)._id,
            quantity: 1,
            price: products[1].price,
          },
        ],
        totalPrice: (products[0].price * 2) + products[1].price,
        status: OrderStatus.COMPLETED,
      },
      {
        user: (customers[1] as any)._id,
        products: [
          {
            product: (products[2] as any)._id,
            quantity: 3,
            price: products[2].price,
          },
          {
            product: (products[3] as any)._id,
            quantity: 1,
            price: products[3].price,
          },
        ],
        totalPrice: (products[2].price * 3) + products[3].price,
        status: OrderStatus.PENDING,
      },
      {
        user: (customers[0] as any)._id,
        products: [
          {
            product: (products[4] as any)._id,
            quantity: 5,
            price: products[4].price,
          },
          {
            product: (products[5] as any)._id,
            quantity: 2,
            price: products[5].price,
          },
        ],
        totalPrice: (products[4].price * 5) + (products[5].price * 2),
        status: OrderStatus.COMPLETED,
      },
    ];

    await this.orderModel.insertMany(ordersData);
    this.logger.log(`Seeded ${ordersData.length} orders`);
  }
}
