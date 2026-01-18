import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PhoneNumbersService } from './phone-numbers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

/**
 * Phone Numbers Controller
 * Manages phone numbers for metrics filtering
 */
@Controller('api/phone-numbers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PhoneNumbersController {
  constructor(private phoneNumbersService: PhoneNumbersService) {}

  /**
   * Get all phone numbers
   */
  @Get()
  @Roles('super_admin', 'admin', 'manager', 'agent')
  async getAllPhoneNumbers(@Query('includeInactive') includeInactive?: string) {
    return this.phoneNumbersService.getAllPhoneNumbers(
      includeInactive === 'true'
    );
  }

  /**
   * Get phone numbers for dropdown (simplified)
   */
  @Get('dropdown')
  @Roles('super_admin', 'admin', 'manager', 'agent')
  async getPhoneNumbersForDropdown() {
    return this.phoneNumbersService.getPhoneNumbersForDropdown();
  }

  /**
   * Get phone number by ID
   */
  @Get(':id')
  @Roles('super_admin', 'admin', 'manager')
  async getPhoneNumberById(@Param('id', ParseIntPipe) id: number) {
    return this.phoneNumbersService.getPhoneNumberById(id);
  }

  /**
   * Create or update phone number
   */
  @Post()
  @Roles('super_admin', 'admin')
  async createPhoneNumber(
    @Body()
    data: {
      number: string;
      friendlyName?: string;
      departmentName?: string;
      type?: string;
      isActive?: boolean;
      isPrimary?: boolean;
      capabilities?: any;
      metadata?: any;
    }
  ) {
    return this.phoneNumbersService.upsertPhoneNumber(data);
  }

  /**
   * Update phone number
   */
  @Put(':id')
  @Roles('super_admin', 'admin')
  async updatePhoneNumber(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    data: {
      friendlyName?: string;
      departmentName?: string;
      type?: string;
      isActive?: boolean;
      isPrimary?: boolean;
      capabilities?: any;
      metadata?: any;
    }
  ) {
    return this.phoneNumbersService.updatePhoneNumber(id, data);
  }

  /**
   * Update department name for a phone number
   */
  @Put(':id/department')
  @Roles('super_admin', 'admin')
  async updateDepartmentName(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { departmentName: string }
  ) {
    return this.phoneNumbersService.updatePhoneNumber(id, {
      departmentName: data.departmentName,
    });
  }

  /**
   * Delete phone number
   */
  @Delete(':id')
  @Roles('super_admin', 'admin')
  async deletePhoneNumber(@Param('id', ParseIntPipe) id: number) {
    return this.phoneNumbersService.deletePhoneNumber(id);
  }

  /**
   * Auto-discover phone numbers from call logs
   */
  @Post('discover')
  @Roles('super_admin', 'admin')
  async discoverPhoneNumbers() {
    return this.phoneNumbersService.discoverPhoneNumbers();
  }

  /**
   * Get primary phone number
   */
  @Get('primary/current')
  @Roles('super_admin', 'admin', 'manager', 'agent')
  async getPrimaryPhoneNumber() {
    return this.phoneNumbersService.getPrimaryPhoneNumber();
  }
}
