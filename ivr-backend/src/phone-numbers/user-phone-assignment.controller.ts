import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  UserPhoneAssignmentService,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  BulkAssignDto,
} from './user-phone-assignment.service';

@Controller('api/phone-numbers/assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserPhoneAssignmentController {
  constructor(private readonly assignmentService: UserPhoneAssignmentService) {}

  /**
   * Assign a phone number to a user (Admin only)
   */
  @Post()
  @Roles('super_admin', 'admin')
  async assignPhoneNumber(
    @Body() dto: CreateAssignmentDto,
    @CurrentUser('id') assignedBy: number
  ) {
    return this.assignmentService.assignPhoneNumber({
      ...dto,
      assignedBy,
    });
  }

  /**
   * Unassign a phone number from a user (Admin only)
   */
  @Delete(':userId/:phoneNumberId')
  @Roles('super_admin', 'admin')
  async unassignPhoneNumber(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('phoneNumberId', ParseIntPipe) phoneNumberId: number
  ) {
    return this.assignmentService.unassignPhoneNumber(userId, phoneNumberId);
  }

  /**
   * Update assignment permissions (Admin only)
   */
  @Put(':userId/:phoneNumberId')
  @Roles('super_admin', 'admin')
  async updateAssignment(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('phoneNumberId', ParseIntPipe) phoneNumberId: number,
    @Body() dto: UpdateAssignmentDto
  ) {
    return this.assignmentService.updateAssignment(userId, phoneNumberId, dto);
  }

  /**
   * Get all phone numbers assigned to a specific user (Admin or self)
   */
  @Get('user/:userId')
  async getUserAssignments(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: any
  ) {
    // Allow users to see their own assignments, or admins to see anyone's
    if (
      currentUser.id !== userId &&
      currentUser.role !== 'admin' &&
      currentUser.role !== 'super_admin'
    ) {
      throw new Error('Forbidden: Cannot view other users assignments');
    }

    return this.assignmentService.getUserAssignedPhoneNumbers(userId);
  }

  /**
   * Get current user's assigned phone numbers
   */
  @Get('me')
  async getMyAssignments(@CurrentUser('id') userId: number) {
    return this.assignmentService.getUserAssignedPhoneNumbers(userId);
  }

  /**
   * Get all users assigned to a specific phone number (Admin only)
   */
  @Get('phone-number/:phoneNumberId')
  @Roles('super_admin', 'admin')
  async getPhoneNumberAssignments(
    @Param('phoneNumberId', ParseIntPipe) phoneNumberId: number
  ) {
    return this.assignmentService.getPhoneNumberAssignedUsers(phoneNumberId);
  }

  /**
   * Bulk assign phone numbers to a user (Admin only)
   */
  @Post('bulk')
  @Roles('super_admin', 'admin')
  async bulkAssign(@Body() dto: BulkAssignDto, @CurrentUser('id') assignedBy: number) {
    return this.assignmentService.bulkAssignPhoneNumbers({
      ...dto,
      assignedBy,
    });
  }

  /**
   * Bulk unassign phone numbers from a user (Admin only)
   */
  @Delete('bulk/user/:userId')
  @Roles('super_admin', 'admin')
  async bulkUnassign(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { phoneNumberIds?: number[] }
  ) {
    return this.assignmentService.bulkUnassignPhoneNumbers(
      userId,
      body.phoneNumberIds
    );
  }

  /**
   * Get all assignments (Admin only)
   */
  @Get()
  @Roles('super_admin', 'admin')
  async getAllAssignments(@Query('includeInactive') includeInactive?: string) {
    return this.assignmentService.getAllAssignments(includeInactive === 'true');
  }

  /**
   * Get phone numbers accessible to current user
   */
  @Get('accessible')
  async getAccessiblePhoneNumbers(
    @CurrentUser('id') userId: number,
    @Query('type') type: 'calls' | 'recordings' | 'analytics' = 'calls'
  ) {
    const phoneNumbers = await this.assignmentService.getUserAccessiblePhoneNumbers(
      userId,
      type
    );

    return {
      userId,
      permissionType: type,
      phoneNumbers,
      count: phoneNumbers.length,
    };
  }

  /**
   * Check if current user has access to a specific phone number
   */
  @Get('check-access/:phoneNumber')
  async checkAccess(
    @Param('phoneNumber') phoneNumber: string,
    @Query('type') type: 'calls' | 'recordings' | 'analytics' = 'calls',
    @CurrentUser('id') userId: number
  ) {
    const hasAccess = await this.assignmentService.hasAccessToPhoneNumber(
      userId,
      phoneNumber,
      type
    );

    return {
      phoneNumber,
      permissionType: type,
      hasAccess,
    };
  }
}
