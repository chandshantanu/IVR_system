import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ExotelService } from '../exotel/exotel.service';

/**
 * HeartBeat Monitoring Service
 * Monitors Exophone health using Exotel's HeartBeat API
 */
@Injectable()
export class HeartbeatService {
  private readonly logger = new Logger(HeartbeatService.name);
  private isEnabled: boolean;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private exotelService: ExotelService,
  ) {
    // Check if monitoring is enabled
    this.isEnabled = this.configService.get<string>('EXOTEL_HEARTBEAT_ENABLED', 'true') === 'true';

    if (this.isEnabled) {
      this.logger.log('HeartBeat monitoring service initialized and enabled');
    } else {
      this.logger.warn('HeartBeat monitoring service is disabled');
    }
  }

  /**
   * Monitor Exophone health every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async monitorExophoneHealth() {
    if (!this.isEnabled) {
      return;
    }

    this.logger.log('Running scheduled Exophone health check');

    try {
      const health = await this.exotelService.checkExophoneHealth();

      // Store health check results
      await this.prisma.healthCheck.create({
        data: {
          timestamp: new Date(health.timestamp || new Date()),
          statusType: health.status_type || 'UNKNOWN',
          incomingAffected: health.incoming_affected,
          outgoingAffected: health.outgoing_affected,
          rawData: health,
        },
      });

      // Alert if health check fails
      if (health.status_type !== 'OK') {
        await this.handleHealthAlert(health);
      }

      this.logger.log(`Health check completed: ${health.status_type}`);
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);

      // Store failed health check
      await this.prisma.healthCheck.create({
        data: {
          timestamp: new Date(),
          statusType: 'ERROR',
          incomingAffected: null,
          outgoingAffected: null,
          rawData: { error: error.message },
        },
      }).catch((dbError) => {
        this.logger.error(`Failed to store health check error: ${dbError.message}`);
      });
    }
  }

  /**
   * Handle health alerts when Exophone is not healthy
   */
  private async handleHealthAlert(health: any) {
    this.logger.warn('🚨 Exophone Health Alert', {
      status: health.status_type,
      incomingAffected: health.incoming_affected,
      outgoingAffected: health.outgoing_affected,
      timestamp: health.timestamp,
    });

    // TODO: Implement alerting mechanism
    // - Send email to administrators
    // - Send Slack notification
    // - Trigger PagerDuty alert
    // - Send SMS to on-call engineers
  }

  /**
   * Get health check history
   */
  async getHealthHistory(limit: number = 100) {
    return this.prisma.healthCheck.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Get current health status
   */
  async getCurrentHealth() {
    const latestCheck = await this.prisma.healthCheck.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    return latestCheck;
  }

  /**
   * Get health statistics for a time range
   */
  async getHealthStats(startDate: Date, endDate: Date) {
    const checks = await this.prisma.healthCheck.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    const total = checks.length;
    const ok = checks.filter(c => c.statusType === 'OK').length;
    const errors = checks.filter(c => c.statusType === 'ERROR').length;
    const warnings = checks.filter(c => c.statusType === 'WARNING').length;

    const uptime = total > 0 ? (ok / total) * 100 : 0;

    return {
      total,
      ok,
      errors,
      warnings,
      uptime: Math.round(uptime * 100) / 100,
      checks,
    };
  }

  /**
   * Manually trigger health check
   */
  async triggerHealthCheck() {
    this.logger.log('Manual health check triggered');
    return this.monitorExophoneHealth();
  }

  /**
   * Sync ExoPhones from Exotel every 6 hours
   * Keeps phone number friendly names up to date with Exotel configuration
   */
  @Cron('0 */6 * * *') // Every 6 hours
  async syncExoPhonesScheduled() {
    this.logger.log('Running scheduled ExoPhone sync');
    try {
      const result = await this.exotelService.syncExoPhonesFromExotel();
      this.logger.log(`Scheduled ExoPhone sync completed: ${result.syncedToDb} phones updated`);
    } catch (error) {
      this.logger.error(`Scheduled ExoPhone sync failed: ${error.message}`);
    }
  }
}
