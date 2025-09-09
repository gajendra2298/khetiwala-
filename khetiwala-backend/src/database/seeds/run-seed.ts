import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed';

async function runSeed() {
  try {
    console.log('🌱 Starting database seeding...');
    
    const app = await NestFactory.createApplicationContext(SeedModule);
    const seedService = app.get(SeedService);
    
    await seedService.seedDatabase();
    
    await app.close();
    
    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

runSeed();
