import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RentalRequestsService } from './rental-requests.service';
import { RentalRequestsController } from './rental-requests.controller';
import { RentalRequest, RentalRequestSchema } from './schemas/rental-request.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Address, AddressSchema } from '../addresses/schemas/address.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RentalRequest.name, schema: RentalRequestSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Address.name, schema: AddressSchema },
    ]),
    NotificationsModule,
    AuthModule,
  ],
  controllers: [RentalRequestsController],
  providers: [RentalRequestsService],
  exports: [RentalRequestsService],
})
export class RentalRequestsModule {}
