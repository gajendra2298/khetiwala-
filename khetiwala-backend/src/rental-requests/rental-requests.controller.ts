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
import { RentalRequestsService } from './rental-requests.service';
import { CreateRentalRequestDto } from './dto/create-rental-request.dto';
import { UpdateRentalRequestDto } from './dto/update-rental-request.dto';
import { RentalRequestResponseDto } from './dto/rental-request-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('rental-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rental-requests')
export class RentalRequestsController {
  constructor(private readonly rentalRequestsService: RentalRequestsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new rental request' })
  @ApiResponse({ status: 201, description: 'Rental request created successfully', type: RentalRequestResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product or address not found' })
  async createRentalRequest(
    @Request() req: any,
    @Body() createRentalRequestDto: CreateRentalRequestDto,
  ): Promise<RentalRequestResponseDto> {
    const rentalRequest = await this.rentalRequestsService.createRentalRequest(req.user.sub, createRentalRequestDto);
    return rentalRequest as any;
  }

  @Get('my-requests')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get rental requests made by the current user' })
  @ApiResponse({ status: 200, description: 'Rental requests retrieved successfully', type: [RentalRequestResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyRequests(@Request() req: any): Promise<RentalRequestResponseDto[]> {
    const requests = await this.rentalRequestsService.findAllByRequester(req.user.sub);
    return requests as any;
  }

  @Get('my-products')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get rental requests for products owned by the current user' })
  @ApiResponse({ status: 200, description: 'Rental requests retrieved successfully', type: [RentalRequestResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyProductRequests(@Request() req: any): Promise<RentalRequestResponseDto[]> {
    const requests = await this.rentalRequestsService.findAllByOwner(req.user.sub);
    return requests as any;
  }

  @Get('stats')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get rental statistics for the current user' })
  @ApiResponse({ status: 200, description: 'Rental statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRentalStats(@Request() req: any): Promise<any> {
    return this.rentalRequestsService.getRentalStats(req.user.sub);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get rental request by ID' })
  @ApiResponse({ status: 200, description: 'Rental request retrieved successfully', type: RentalRequestResponseDto })
  @ApiResponse({ status: 404, description: 'Rental request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRentalRequest(@Request() req: any, @Param('id') id: string): Promise<RentalRequestResponseDto> {
    const rentalRequest = await this.rentalRequestsService.findById(id, req.user.sub);
    return rentalRequest as any;
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update rental request' })
  @ApiResponse({ status: 200, description: 'Rental request updated successfully', type: RentalRequestResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Rental request not found' })
  async updateRentalRequest(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateRentalRequestDto: UpdateRentalRequestDto,
  ): Promise<RentalRequestResponseDto> {
    const rentalRequest = await this.rentalRequestsService.updateRentalRequest(id, req.user.sub, updateRentalRequestDto);
    return rentalRequest as any;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete rental request (only pending requests)' })
  @ApiResponse({ status: 204, description: 'Rental request deleted successfully' })
  @ApiResponse({ status: 404, description: 'Rental request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteRentalRequest(@Request() req: any, @Param('id') id: string): Promise<void> {
    await this.rentalRequestsService.deleteRentalRequest(id, req.user.sub);
  }
}
