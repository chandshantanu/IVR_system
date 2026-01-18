import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Phone Numbers Service
 * Manages phone numbers for metrics filtering and tracking
 */
@Injectable()
export class PhoneNumbersService {
  private readonly logger = new Logger(PhoneNumbersService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all phone numbers
   */
  async getAllPhoneNumbers(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };

    return this.prisma.phoneNumber.findMany({
      where,
      orderBy: [
        { isPrimary: 'desc' },
        { friendlyName: 'asc' },
      ],
    });
  }

  /**
   * Get phone number by ID
   */
  async getPhoneNumberById(id: number) {
    const phoneNumber = await this.prisma.phoneNumber.findUnique({
      where: { id },
    });

    if (!phoneNumber) {
      throw new NotFoundException(`Phone number with ID ${id} not found`);
    }

    return phoneNumber;
  }

  /**
   * Get phone number by number
   */
  async getPhoneNumberByNumber(number: string) {
    return this.prisma.phoneNumber.findUnique({
      where: { number },
    });
  }

  /**
   * Create or update phone number
   */
  async upsertPhoneNumber(data: {
    number: string;
    friendlyName?: string;
    departmentName?: string;
    type?: string;
    isActive?: boolean;
    isPrimary?: boolean;
    capabilities?: any;
    metadata?: any;
  }) {
    // If setting as primary, unset other primary numbers
    if (data.isPrimary) {
      await this.prisma.phoneNumber.updateMany({
        where: { isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.phoneNumber.upsert({
      where: { number: data.number },
      create: {
        number: data.number,
        friendlyName: data.friendlyName,
        departmentName: data.departmentName,
        type: data.type || 'exophone',
        isActive: data.isActive !== undefined ? data.isActive : true,
        isPrimary: data.isPrimary || false,
        capabilities: data.capabilities,
        metadata: data.metadata,
      },
      update: {
        friendlyName: data.friendlyName,
        departmentName: data.departmentName,
        type: data.type,
        isActive: data.isActive,
        isPrimary: data.isPrimary,
        capabilities: data.capabilities,
        metadata: data.metadata,
      },
    });
  }

  /**
   * Update phone number
   */
  async updatePhoneNumber(
    id: number,
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
    // If setting as primary, unset other primary numbers
    if (data.isPrimary) {
      await this.prisma.phoneNumber.updateMany({
        where: { isPrimary: true, NOT: { id } },
        data: { isPrimary: false },
      });
    }

    return this.prisma.phoneNumber.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete phone number
   */
  async deletePhoneNumber(id: number) {
    return this.prisma.phoneNumber.delete({
      where: { id },
    });
  }

  /**
   * Get primary phone number
   */
  async getPrimaryPhoneNumber() {
    return this.prisma.phoneNumber.findFirst({
      where: { isPrimary: true, isActive: true },
    });
  }

  /**
   * Get active phone numbers for dropdown
   */
  async getPhoneNumbersForDropdown() {
    const numbers = await this.prisma.phoneNumber.findMany({
      where: { isActive: true },
      select: {
        id: true,
        number: true,
        friendlyName: true,
        isPrimary: true,
      },
      orderBy: [
        { isPrimary: 'desc' },
        { friendlyName: 'asc' },
      ],
    });

    return numbers.map(n => ({
      id: n.id,
      number: n.number,
      label: n.friendlyName || n.number,
      isPrimary: n.isPrimary,
    }));
  }

  /**
   * Auto-discover phone numbers from call logs
   */
  async discoverPhoneNumbers() {
    this.logger.log('Discovering phone numbers from call logs');

    // Get unique called numbers from flow executions
    const calledNumbers = await this.prisma.flowExecution.findMany({
      select: { calledNumber: true },
      distinct: ['calledNumber'],
      where: {
        calledNumber: { not: null },
      },
    });

    let discovered = 0;

    for (const { calledNumber } of calledNumbers) {
      if (!calledNumber) continue;

      const existing = await this.getPhoneNumberByNumber(calledNumber);

      if (!existing) {
        await this.upsertPhoneNumber({
          number: calledNumber,
          friendlyName: `Auto-discovered: ${calledNumber}`,
          type: 'exophone',
          isActive: true,
          isPrimary: false,
        });
        discovered++;
      }
    }

    this.logger.log(`Discovered ${discovered} new phone numbers`);

    return { discovered, total: calledNumbers.length };
  }
}
