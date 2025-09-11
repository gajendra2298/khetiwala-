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
    console.log('findActiveAddressByUser: Looking for active address for user:', userId);
    const address = await this.addressModel.findOne({ 
      userId: new Types.ObjectId(userId), 
      isActive: true 
    });
    console.log('findActiveAddressByUser: Found address:', address);
    return address;
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
    try {
      console.log('updateAddress: Starting update for addressId:', addressId, 'userId:', userId);
      
      // Validate ObjectId format
      if (!addressId || addressId === 'undefined') {
        console.log('updateAddress: Invalid addressId:', addressId);
        throw new BadRequestException('Address ID is required');
      }
      
      if (!Types.ObjectId.isValid(addressId)) {
        console.log('updateAddress: Invalid addressId format:', addressId);
        throw new BadRequestException('Invalid address ID format');
      }
      
      if (!Types.ObjectId.isValid(userId)) {
        console.log('updateAddress: Invalid userId format:', userId);
        throw new BadRequestException('Invalid user ID format');
      }

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
        console.log('updateAddress: Address not found');
        throw new NotFoundException('Address not found');
      }

      console.log('updateAddress: Address updated successfully:', address._id);
      return address;
    } catch (error) {
      console.error('updateAddress: Error occurred:', error);
      throw error;
    }
  }

  async deleteAddress(addressId: string, userId: string): Promise<void> {
    try {
      console.log('deleteAddress: Starting deletion for addressId:', addressId, 'userId:', userId);
      
      // Validate ObjectId format
      if (!Types.ObjectId.isValid(addressId)) {
        console.log('deleteAddress: Invalid addressId format:', addressId);
        throw new BadRequestException('Invalid address ID format');
      }
      
      if (!Types.ObjectId.isValid(userId)) {
        console.log('deleteAddress: Invalid userId format:', userId);
        throw new BadRequestException('Invalid user ID format');
      }
      
      const address = await this.addressModel.findOne({
        _id: new Types.ObjectId(addressId),
        userId: new Types.ObjectId(userId),
      });

      if (!address) {
        console.log('deleteAddress: Address not found');
        throw new NotFoundException('Address not found');
      }

      console.log('deleteAddress: Found address:', address._id, 'isActive:', address.isActive);

      // If deleting active address, make another address active
      if (address.isActive) {
        // First, deactivate all addresses for this user
        await this.addressModel.updateMany(
          { userId: new Types.ObjectId(userId) },
          { $set: { isActive: false } }
        );

        // Then find another address to set as active
        const anotherAddress = await this.addressModel.findOne({
          userId: new Types.ObjectId(userId),
          _id: { $ne: new Types.ObjectId(addressId) }
        });

        if (anotherAddress) {
          console.log('deleteAddress: Setting another address as active:', anotherAddress._id);
          // Use updateOne to avoid potential race conditions
          await this.addressModel.updateOne(
            { _id: anotherAddress._id },
            { $set: { isActive: true } }
          );
        } else {
          console.log('deleteAddress: No other addresses found to set as active');
        }
      }

      console.log('deleteAddress: Deleting address:', addressId);
      await this.addressModel.findByIdAndDelete(new Types.ObjectId(addressId));
      console.log('deleteAddress: Address deleted successfully');
    } catch (error) {
      console.error('deleteAddress: Error occurred:', error);
      throw error;
    }
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
