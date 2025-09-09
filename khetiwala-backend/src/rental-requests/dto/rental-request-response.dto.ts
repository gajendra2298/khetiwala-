import { ApiProperty } from '@nestjs/swagger';
import { RentalRequestStatus } from '../schemas/rental-request.schema';

export class RentalRequestResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  requester: {
    _id: string;
    name: string;
    email: string;
  };

  @ApiProperty()
  owner: {
    _id: string;
    name: string;
    email: string;
  };

  @ApiProperty()
  product: {
    _id: string;
    title: string;
    description: string;
    image: string;
    rentalPrice: number;
  };

  @ApiProperty()
  deliveryAddress: {
    _id: string;
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
  };

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  rentalDays: number;

  @ApiProperty()
  dailyRate: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ enum: RentalRequestStatus })
  status: RentalRequestStatus;

  @ApiProperty()
  message?: string;

  @ApiProperty()
  rejectionReason?: string;

  @ApiProperty()
  approvedAt?: Date;

  @ApiProperty()
  deliveredAt?: Date;

  @ApiProperty()
  returnedAt?: Date;

  @ApiProperty()
  isDelivered: boolean;

  @ApiProperty()
  isReturned: boolean;

  @ApiProperty()
  deliveryNotes?: string;

  @ApiProperty()
  returnNotes?: string;

  @ApiProperty()
  rating?: number;

  @ApiProperty()
  review?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
