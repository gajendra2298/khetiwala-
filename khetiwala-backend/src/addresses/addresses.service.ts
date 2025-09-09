import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Address, AddressDocument } from './schemas/address.schema';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
  ) {}

  async createAddress(userId: string, createAddressDto: CreateAddressDto): Promise<Address> {
    const { isActive, ...addressData } = createAddressDto;

    // If setting as active, deactivate all other addresses for this user
    if (isActive) {
      await this.addressModel.updateMany(
        { userId: new Types.ObjectId(userId) },
        { isActive: false }
      );
    }

    // If this is the first address, make it active by default
    const existingAddresses = await this.addressModel.countDocuments({ userId: new Types.ObjectId(userId) });
    const shouldBeActive = isActive || existingAddresses === 0;

    const address = new this.addressModel({
      ...addressData,
      userId: new Types.ObjectId(userId),
      isActive: shouldBeActive,
    });

    return address.save();
  }

  async findAllAddressesByUser(userId: string): Promise<Address[]> {
    return this.addressModel.find({ userId: new Types.ObjectId(userId) }).sort({ isActive: -1, createdAt: -1 });
  }

  async findActiveAddressByUser(userId: string): Promise<Address | null> {
    return this.addressModel.findOne({ 
      userId: new Types.ObjectId(userId), 
      isActive: true 
    });
  }

  async findAddressById(addressId: string, userId: string): Promise<Address> {
    const address = await this.addressModel.findOne({
      _id: new Types.ObjectId(addressId),
      userId: new Types.ObjectId(userId),
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async updateAddress(addressId: string, userId: string, updateAddressDto: UpdateAddressDto): Promise<Address> {
    const { isActive, ...updateData } = updateAddressDto;

    // If setting as active, deactivate all other addresses for this user
    if (isActive) {
      await this.addressModel.updateMany(
        { userId: new Types.ObjectId(userId), _id: { $ne: new Types.ObjectId(addressId) } },
        { isActive: false }
      );
    }

    const address = await this.addressModel.findOneAndUpdate(
      { _id: new Types.ObjectId(addressId), userId: new Types.ObjectId(userId) },
      { ...updateData, ...(isActive !== undefined && { isActive }) },
      { new: true }
    );

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async deleteAddress(addressId: string, userId: string): Promise<void> {
    const address = await this.addressModel.findOne({
      _id: new Types.ObjectId(addressId),
      userId: new Types.ObjectId(userId),
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // If deleting active address, make another address active
    if (address.isActive) {
      const anotherAddress = await this.addressModel.findOne({
        userId: new Types.ObjectId(userId),
        _id: { $ne: new Types.ObjectId(addressId) }
      });

      if (anotherAddress) {
        anotherAddress.isActive = true;
        await anotherAddress.save();
      }
    }

    await this.addressModel.findByIdAndDelete(addressId);
  }

  async setActiveAddress(addressId: string, userId: string): Promise<Address> {
    // Deactivate all addresses for this user
    await this.addressModel.updateMany(
      { userId: new Types.ObjectId(userId) },
      { isActive: false }
    );

    // Activate the specified address
    const address = await this.addressModel.findOneAndUpdate(
      { _id: new Types.ObjectId(addressId), userId: new Types.ObjectId(userId) },
      { isActive: true },
      { new: true }
    );

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async hasActiveAddress(userId: string): Promise<boolean> {
    const activeAddress = await this.addressModel.findOne({
      userId: new Types.ObjectId(userId),
      isActive: true
    });
    return !!activeAddress;
  }
}
