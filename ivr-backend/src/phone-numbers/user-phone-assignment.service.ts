import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAssignmentDto {
  userId: number;
  phoneNumberId: number;
  canViewCalls?: boolean;
  canViewRecordings?: boolean;
  canViewAnalytics?: boolean;
  assignedBy?: number;
}

export interface UpdateAssignmentDto {
  canViewCalls?: boolean;
  canViewRecordings?: boolean;
  canViewAnalytics?: boolean;
}

export interface BulkAssignDto {
  userId: number;
  phoneNumberIds: number[];
  canViewCalls?: boolean;
  canViewRecordings?: boolean;
  canViewAnalytics?: boolean;
  assignedBy?: number;
}

@Injectable()
export class UserPhoneAssignmentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Assign a phone number to a user
   */
  async assignPhoneNumber(dto: CreateAssignmentDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    // Check if phone number exists
    const phoneNumber = await this.prisma.phoneNumber.findUnique({
      where: { id: dto.phoneNumberId },
    });
    if (!phoneNumber) {
      throw new NotFoundException(`Phone number with ID ${dto.phoneNumberId} not found`);
    }

    // Check if assignment already exists
    const existing = await this.prisma.userPhoneNumberAssignment.findUnique({
      where: {
        userId_phoneNumberId: {
          userId: dto.userId,
          phoneNumberId: dto.phoneNumberId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `User ${dto.userId} is already assigned to phone number ${dto.phoneNumberId}`
      );
    }

    // Create assignment
    return this.prisma.userPhoneNumberAssignment.create({
      data: {
        userId: dto.userId,
        phoneNumberId: dto.phoneNumberId,
        canViewCalls: dto.canViewCalls ?? true,
        canViewRecordings: dto.canViewRecordings ?? true,
        canViewAnalytics: dto.canViewAnalytics ?? true,
        assignedBy: dto.assignedBy,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
        phoneNumber: {
          select: {
            id: true,
            number: true,
            friendlyName: true,
            type: true,
            isActive: true,
          },
        },
      },
    });
  }

  /**
   * Unassign a phone number from a user
   */
  async unassignPhoneNumber(userId: number, phoneNumberId: number) {
    const assignment = await this.prisma.userPhoneNumberAssignment.findUnique({
      where: {
        userId_phoneNumberId: {
          userId,
          phoneNumberId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Assignment not found for user ${userId} and phone number ${phoneNumberId}`
      );
    }

    await this.prisma.userPhoneNumberAssignment.delete({
      where: {
        userId_phoneNumberId: {
          userId,
          phoneNumberId,
        },
      },
    });

    return { message: 'Phone number unassigned successfully' };
  }

  /**
   * Update assignment permissions
   */
  async updateAssignment(
    userId: number,
    phoneNumberId: number,
    dto: UpdateAssignmentDto
  ) {
    const assignment = await this.prisma.userPhoneNumberAssignment.findUnique({
      where: {
        userId_phoneNumberId: {
          userId,
          phoneNumberId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Assignment not found for user ${userId} and phone number ${phoneNumberId}`
      );
    }

    return this.prisma.userPhoneNumberAssignment.update({
      where: {
        userId_phoneNumberId: {
          userId,
          phoneNumberId,
        },
      },
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
        phoneNumber: {
          select: {
            id: true,
            number: true,
            friendlyName: true,
            type: true,
            isActive: true,
          },
        },
      },
    });
  }

  /**
   * Get all phone numbers assigned to a user
   */
  async getUserAssignedPhoneNumbers(userId: number) {
    return this.prisma.userPhoneNumberAssignment.findMany({
      where: { userId },
      include: {
        phoneNumber: {
          select: {
            id: true,
            number: true,
            friendlyName: true,
            type: true,
            isActive: true,
            isPrimary: true,
            capabilities: true,
            metadata: true,
          },
        },
      },
    });
  }

  /**
   * Get all users assigned to a phone number
   */
  async getPhoneNumberAssignedUsers(phoneNumberId: number) {
    return this.prisma.userPhoneNumberAssignment.findMany({
      where: { phoneNumberId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
  }

  /**
   * Check if a user has access to a specific phone number
   */
  async hasAccessToPhoneNumber(
    userId: number,
    phoneNumber: string,
    permissionType: 'calls' | 'recordings' | 'analytics' = 'calls'
  ): Promise<boolean> {
    // Admins and super_admins have access to everything
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user && (user.role === 'super_admin' || user.role === 'admin')) {
      return true;
    }

    // Check if user has specific assignment
    const phoneNumberRecord = await this.prisma.phoneNumber.findUnique({
      where: { number: phoneNumber },
      select: { id: true },
    });

    if (!phoneNumberRecord) {
      return false;
    }

    const assignment = await this.prisma.userPhoneNumberAssignment.findUnique({
      where: {
        userId_phoneNumberId: {
          userId,
          phoneNumberId: phoneNumberRecord.id,
        },
      },
    });

    if (!assignment) {
      return false;
    }

    // Check specific permission
    switch (permissionType) {
      case 'calls':
        return assignment.canViewCalls;
      case 'recordings':
        return assignment.canViewRecordings;
      case 'analytics':
        return assignment.canViewAnalytics;
      default:
        return false;
    }
  }

  /**
   * Get list of phone numbers a user can access
   */
  async getUserAccessiblePhoneNumbers(
    userId: number,
    permissionType: 'calls' | 'recordings' | 'analytics' = 'calls'
  ): Promise<string[]> {
    // Admins and super_admins have access to all phone numbers
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user && (user.role === 'super_admin' || user.role === 'admin')) {
      const allPhoneNumbers = await this.prisma.phoneNumber.findMany({
        where: { isActive: true },
        select: { number: true },
      });
      return allPhoneNumbers.map((p) => p.number);
    }

    // Get user's assigned phone numbers with specific permission
    const assignments = await this.prisma.userPhoneNumberAssignment.findMany({
      where: {
        userId,
        ...(permissionType === 'calls' && { canViewCalls: true }),
        ...(permissionType === 'recordings' && { canViewRecordings: true }),
        ...(permissionType === 'analytics' && { canViewAnalytics: true }),
      },
      include: {
        phoneNumber: {
          select: {
            number: true,
            isActive: true,
          },
        },
      },
    });

    return assignments
      .filter((a) => a.phoneNumber.isActive)
      .map((a) => a.phoneNumber.number);
  }

  /**
   * Bulk assign phone numbers to a user
   */
  async bulkAssignPhoneNumbers(dto: BulkAssignDto) {
    const { userId, phoneNumberIds, assignedBy } = dto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Verify all phone numbers exist
    const phoneNumbers = await this.prisma.phoneNumber.findMany({
      where: { id: { in: phoneNumberIds } },
      select: { id: true },
    });

    if (phoneNumbers.length !== phoneNumberIds.length) {
      throw new NotFoundException('One or more phone numbers not found');
    }

    // Get existing assignments
    const existingAssignments = await this.prisma.userPhoneNumberAssignment.findMany({
      where: {
        userId,
        phoneNumberId: { in: phoneNumberIds },
      },
      select: { phoneNumberId: true },
    });

    const existingIds = new Set(existingAssignments.map((a) => a.phoneNumberId));
    const newPhoneNumberIds = phoneNumberIds.filter((id) => !existingIds.has(id));

    if (newPhoneNumberIds.length === 0) {
      return {
        message: 'All phone numbers already assigned',
        assigned: 0,
        skipped: existingIds.size,
      };
    }

    // Create new assignments
    await this.prisma.userPhoneNumberAssignment.createMany({
      data: newPhoneNumberIds.map((phoneNumberId) => ({
        userId,
        phoneNumberId,
        canViewCalls: dto.canViewCalls ?? true,
        canViewRecordings: dto.canViewRecordings ?? true,
        canViewAnalytics: dto.canViewAnalytics ?? true,
        assignedBy,
      })),
    });

    return {
      message: 'Phone numbers assigned successfully',
      assigned: newPhoneNumberIds.length,
      skipped: existingIds.size,
    };
  }

  /**
   * Bulk unassign all phone numbers from a user
   */
  async bulkUnassignPhoneNumbers(userId: number, phoneNumberIds?: number[]) {
    const where: any = { userId };

    if (phoneNumberIds && phoneNumberIds.length > 0) {
      where.phoneNumberId = { in: phoneNumberIds };
    }

    const result = await this.prisma.userPhoneNumberAssignment.deleteMany({
      where,
    });

    return {
      message: 'Phone numbers unassigned successfully',
      count: result.count,
    };
  }

  /**
   * Get all assignments (for admin)
   */
  async getAllAssignments(includeInactive = false) {
    return this.prisma.userPhoneNumberAssignment.findMany({
      where: includeInactive
        ? undefined
        : {
            user: { isActive: true },
            phoneNumber: { isActive: true },
          },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            role: true,
            isActive: true,
          },
        },
        phoneNumber: {
          select: {
            id: true,
            number: true,
            friendlyName: true,
            type: true,
            isActive: true,
            isPrimary: true,
          },
        },
      },
      orderBy: [{ userId: 'asc' }, { phoneNumberId: 'asc' }],
    });
  }
}
