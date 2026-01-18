import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Business Hours Schedule
 */
export interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  isOpen: boolean;
  openTime?: string; // HH:MM format (e.g., "09:00")
  closeTime?: string; // HH:MM format (e.g., "18:00")
  breaks?: TimeRange[]; // Lunch breaks, etc.
}

/**
 * Time Range
 */
export interface TimeRange {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

/**
 * Holiday Configuration
 */
export interface Holiday {
  id: number;
  name: string;
  date: Date;
  isRecurring: boolean; // True for annual holidays
  message?: string; // Custom message for this holiday
}

/**
 * Business Hours Configuration
 */
export interface BusinessHoursConfig {
  id: number;
  name: string;
  timezone: string;
  schedule: DaySchedule[];
  holidays: Holiday[];
  overrideDates?: OverrideDate[]; // Special dates with custom hours
}

/**
 * Override Date (e.g., special operating hours for specific dates)
 */
export interface OverrideDate {
  date: Date;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  message?: string;
}

/**
 * BusinessHoursService - Manages business hours and holiday schedules
 */
@Injectable()
export class BusinessHoursService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if currently within business hours
   * @param configId - Business hours configuration ID (optional, uses default if not provided)
   * @param timezone - Timezone to check (optional, uses config timezone)
   * @returns True if within business hours
   */
  async isBusinessHours(configId?: number, timezone?: string): Promise<boolean> {
    const config = await this.getBusinessHoursConfig(configId);
    const now = new Date();

    // Convert to configured timezone
    const tz = timezone || config.timezone || 'UTC';
    const localTime = this.convertToTimezone(now, tz);

    // Check if it's a holiday
    if (await this.isHoliday(localTime, config)) {
      return false;
    }

    // Check if there's a date override
    const override = await this.getOverrideForDate(localTime, config);
    if (override) {
      if (!override.isOpen) {
        return false;
      }
      return this.isWithinTimeRange(localTime, override.openTime!, override.closeTime!);
    }

    // Check regular schedule
    const dayOfWeek = localTime.getDay();
    const daySchedule = config.schedule.find(s => s.dayOfWeek === dayOfWeek);

    if (!daySchedule || !daySchedule.isOpen) {
      return false;
    }

    // Check if within operating hours
    const isWithinHours = this.isWithinTimeRange(
      localTime,
      daySchedule.openTime!,
      daySchedule.closeTime!
    );

    if (!isWithinHours) {
      return false;
    }

    // Check if in a break period
    if (daySchedule.breaks) {
      for (const breakTime of daySchedule.breaks) {
        if (this.isWithinTimeRange(localTime, breakTime.startTime, breakTime.endTime)) {
          return false; // Currently in break
        }
      }
    }

    return true;
  }

  /**
   * Get next available time
   * @param configId - Business hours configuration ID
   * @returns Date of next available time
   */
  async getNextAvailableTime(configId?: number): Promise<Date> {
    const config = await this.getBusinessHoursConfig(configId);
    const now = new Date();
    const tz = config.timezone || 'UTC';

    // Start from current time
    let checkTime = this.convertToTimezone(now, tz);
    let daysChecked = 0;
    const maxDays = 14; // Check up to 2 weeks ahead

    while (daysChecked < maxDays) {
      const dayOfWeek = checkTime.getDay();
      const daySchedule = config.schedule.find(s => s.dayOfWeek === dayOfWeek);

      // Check if this day is open
      if (daySchedule && daySchedule.isOpen) {
        // Check if not a holiday
        if (!(await this.isHoliday(checkTime, config))) {
          // Check for override
          const override = await this.getOverrideForDate(checkTime, config);

          if (!override || override.isOpen) {
            const openTime = override?.openTime || daySchedule.openTime!;
            const nextTime = this.combineDateTime(checkTime, openTime);

            // If this time is in the future, return it
            if (nextTime > now) {
              return nextTime;
            }
          }
        }
      }

      // Move to next day
      checkTime = new Date(checkTime);
      checkTime.setDate(checkTime.getDate() + 1);
      checkTime.setHours(0, 0, 0, 0);
      daysChecked++;
    }

    // Fallback: return tomorrow 9 AM
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Get business hours message
   * @param configId - Business hours configuration ID
   * @returns Message describing business hours
   */
  async getBusinessHoursMessage(configId?: number): Promise<string> {
    const config = await this.getBusinessHoursConfig(configId);
    const now = new Date();
    const tz = config.timezone || 'UTC';
    const localTime = this.convertToTimezone(now, tz);

    // Check if holiday
    const holiday = await this.getCurrentHoliday(localTime, config);
    if (holiday) {
      return holiday.message || `We are closed for ${holiday.name}. Please try again later.`;
    }

    // Check for date override
    const override = await this.getOverrideForDate(localTime, config);
    if (override && override.message) {
      return override.message;
    }

    // Get regular schedule message
    const dayOfWeek = localTime.getDay();
    const daySchedule = config.schedule.find(s => s.dayOfWeek === dayOfWeek);

    if (!daySchedule || !daySchedule.isOpen) {
      return 'We are currently closed. Our business hours are Monday through Friday, 9 AM to 6 PM.';
    }

    return `Our business hours are ${daySchedule.openTime} to ${daySchedule.closeTime}.`;
  }

  /**
   * Get business hours configuration
   */
  private async getBusinessHoursConfig(configId?: number): Promise<BusinessHoursConfig> {
    // TODO: Implement database lookup
    // For now, return default configuration

    if (configId) {
      const dbConfig = await this.prisma.businessHours.findUnique({
        where: { id: configId }
      });

      if (dbConfig) {
        // TODO: Parse and return full config
      }
    }

    // Default configuration: Monday-Friday, 9 AM - 6 PM
    return {
      id: 1,
      name: 'Default Business Hours',
      timezone: 'Asia/Kolkata',
      schedule: [
        { dayOfWeek: 0, isOpen: false }, // Sunday
        { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '18:00' }, // Monday
        { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '18:00' }, // Tuesday
        { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '18:00' }, // Wednesday
        { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '18:00' }, // Thursday
        { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '18:00' }, // Friday
        { dayOfWeek: 6, isOpen: false } // Saturday
      ],
      holidays: [
        {
          id: 1,
          name: 'Republic Day',
          date: new Date('2026-01-26'),
          isRecurring: true,
          message: 'We are closed for Republic Day'
        },
        {
          id: 2,
          name: 'Independence Day',
          date: new Date('2026-08-15'),
          isRecurring: true,
          message: 'We are closed for Independence Day'
        },
        {
          id: 3,
          name: 'Gandhi Jayanti',
          date: new Date('2026-10-02'),
          isRecurring: true,
          message: 'We are closed for Gandhi Jayanti'
        }
      ]
    };
  }

  /**
   * Check if date is a holiday
   */
  private async isHoliday(date: Date, config: BusinessHoursConfig): Promise<boolean> {
    const holiday = await this.getCurrentHoliday(date, config);
    return !!holiday;
  }

  /**
   * Get current holiday if any
   */
  private async getCurrentHoliday(date: Date, config: BusinessHoursConfig): Promise<Holiday | null> {
    for (const holiday of config.holidays) {
      if (holiday.isRecurring) {
        // Check month and day only
        if (
          date.getMonth() === holiday.date.getMonth() &&
          date.getDate() === holiday.date.getDate()
        ) {
          return holiday;
        }
      } else {
        // Check exact date
        if (this.isSameDate(date, holiday.date)) {
          return holiday;
        }
      }
    }
    return null;
  }

  /**
   * Get override for specific date
   */
  private async getOverrideForDate(date: Date, config: BusinessHoursConfig): Promise<OverrideDate | null> {
    if (!config.overrideDates) {
      return null;
    }

    for (const override of config.overrideDates) {
      if (this.isSameDate(date, override.date)) {
        return override;
      }
    }

    return null;
  }

  /**
   * Check if time is within range
   */
  private isWithinTimeRange(date: Date, startTime: string, endTime: string): boolean {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    const [startHour, startMin] = startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;

    const [endHour, endMin] = endTime.split(':').map(Number);
    const endMinutes = endHour * 60 + endMin;

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  /**
   * Convert date to timezone
   */
  private convertToTimezone(date: Date, timezone: string): Date {
    // TODO: Implement proper timezone conversion
    // For now, return as-is
    return new Date(date);
  }

  /**
   * Combine date and time string
   */
  private combineDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDate(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
}
