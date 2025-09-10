import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressResponseDto } from './dto/address-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('addresses')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new address' })
  @ApiResponse({ status: 201, description: 'Address created successfully', type: AddressResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createAddress(@Request() req: any, @Body() createAddressDto: CreateAddressDto): Promise<AddressResponseDto> {
    const address = await this.addressesService.createAddress(req.user.sub, createAddressDto);
    return address as any;
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all addresses for the current user' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully', type: [AddressResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAllAddresses(@Request() req: any): Promise<AddressResponseDto[]> {
    const addresses = await this.addressesService.findAllAddressesByUser(req.user.sub);
    return addresses as any;
  }

  @Get('active')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get active address for the current user' })
  @ApiResponse({ status: 200, description: 'Active address retrieved successfully', type: AddressResponseDto })
  @ApiResponse({ status: 404, description: 'No active address found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findActiveAddress(@Request() req: any): Promise<AddressResponseDto | null> {
    const address = await this.addressesService.findActiveAddressByUser(req.user.sub);
    return address as any;
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get address by ID' })
  @ApiResponse({ status: 200, description: 'Address retrieved successfully', type: AddressResponseDto })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAddressById(@Request() req: any, @Param('id') id: string): Promise<AddressResponseDto> {
    const address = await this.addressesService.findAddressById(id, req.user.sub);
    return address as any;
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update address by ID' })
  @ApiResponse({ status: 200, description: 'Address updated successfully', type: AddressResponseDto })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateAddress(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    console.log('AddressesController.updateAddress: Received request to update address:', id, 'for user:', req.user.sub);
    try {
      const address = await this.addressesService.updateAddress(id, req.user.sub, updateAddressDto);
      console.log('AddressesController.updateAddress: Address updated successfully');
      return address as any;
    } catch (error) {
      console.error('AddressesController.updateAddress: Error:', error);
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete address by ID' })
  @ApiResponse({ status: 204, description: 'Address deleted successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAddress(@Request() req: any, @Param('id') id: string): Promise<void> {
    console.log('AddressesController.deleteAddress: Received request to delete address:', id, 'for user:', req.user.sub);
    try {
      await this.addressesService.deleteAddress(id, req.user.sub);
      console.log('AddressesController.deleteAddress: Address deleted successfully');
    } catch (error) {
      console.error('AddressesController.deleteAddress: Error:', error);
      throw error;
    }
  }

  @Patch(':id/set-active')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Set address as active' })
  @ApiResponse({ status: 200, description: 'Address set as active successfully', type: AddressResponseDto })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async setActiveAddress(@Request() req: any, @Param('id') id: string): Promise<AddressResponseDto> {
    const address = await this.addressesService.setActiveAddress(id, req.user.sub);
    return address as any;
  }
}
