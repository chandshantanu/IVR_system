import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ExotelService } from '../exotel/exotel.service';

/**
 * Sync Service
 * Synchronizes call details from Exotel's Bulk Call Details API
 */
@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private isEnabled: boolean;
  private syncIntervalMinutes: number;
  private isSyncing: boolean = false;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private exotelService: ExotelService,
  ) {
    // Check if sync is enabled
    this.isEnabled = this.configService.get<string>('EXOTEL_SYNC_ENABLED', 'true') === 'true';
    this.syncIntervalMinutes = parseInt(
      this.configService.get<string>('EXOTEL_SYNC_INTERVAL_MINUTES', '15'),
      10
    );

    if (this.isEnabled) {
      this.logger.log(`Bulk call details sync service initialized (interval: ${this.syncIntervalMinutes} minutes)`);
    } else {
      this.logger.warn('Bulk call details sync service is disabled');
    }
  }

  /**
   * Sync bulk call details every 15 minutes
   */
  @Cron('*/15 * * * *') // Every 15 minutes
  async syncBulkCallDetails() {
    if (!this.isEnabled || this.isSyncing) {
      if (this.isSyncing) {
        this.logger.warn('Sync already in progress, skipping this interval');
      }
      return;
    }

    this.logger.log('Starting scheduled bulk call details sync');
    this.isSyncing = true;

    try {
      // Get last successful sync time
      const lastSync = await this.getLastSyncTime();
      const now = new Date();

      // Sync calls from last sync time to now
      const bulkDetails = await this.exotelService.fetchBulkCallDetails(lastSync, now);

      // Reconcile call details
      const syncedCount = await this.reconcileCallDetails(bulkDetails);

      // Update sync status
      await this.updateSyncStatus('bulk_call_details', now, 'success', syncedCount);

      this.logger.log(`Bulk call details sync completed: ${syncedCount} records synchronized`);
    } catch (error) {
      this.logger.error(`Bulk call details sync failed: ${error.message}`, error.stack);

      // Update sync status with error
      await this.updateSyncStatus('bulk_call_details', new Date(), 'failed', 0, error.message);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get last successful sync time
   */
  private async getLastSyncTime(): Promise<Date> {
    const lastSync = await this.prisma.syncStatus.findFirst({
      where: {
        syncType: 'bulk_call_details',
        status: 'success',
      },
      orderBy: {
        lastSyncTime: 'desc',
      },
    });

    if (lastSync) {
      this.logger.debug(`Last sync time: ${lastSync.lastSyncTime.toISOString()}`);
      return lastSync.lastSyncTime;
    }

    // If no previous sync, start from 24 hours ago
    const defaultStart = new Date();
    defaultStart.setHours(defaultStart.getHours() - 24);
    this.logger.debug(`No previous sync found, using default: ${defaultStart.toISOString()}`);
    return defaultStart;
  }

  /**
   * Reconcile call details from Exotel with local database
   */
  private async reconcileCallDetails(bulkDetails: any): Promise<number> {
    if (!bulkDetails?.Calls || !Array.isArray(bulkDetails.Calls)) {
      this.logger.warn('No calls found in bulk details response');
      return 0;
    }

    const calls = bulkDetails.Calls;
    let syncedCount = 0;

    for (const call of calls) {
      try {
        // Check if call already exists in voice callbacks
        const existing = await this.prisma.voiceCallback.findFirst({
          where: { callSid: call.Sid },
        });

        if (existing) {
          // Update existing record with additional Exotel data
          await this.prisma.voiceCallback.update({
            where: { id: existing.id },
            data: {
              status: call.Status || existing.status,
              duration: call.Duration || existing.duration,
              price: call.Price || existing.price,
              recordingUrl: call.RecordingUrl || existing.recordingUrl,
              startTime: call.StartTime || existing.startTime,
              endTime: call.EndTime || existing.endTime,
              answeredBy: call.AnsweredBy || existing.answeredBy,
              direction: call.Direction || existing.direction,
            },
          });

          this.logger.debug(`Updated existing call: ${call.Sid}`);
        } else {
          // Create new voice callback record
          await this.prisma.voiceCallback.create({
            data: {
              userId: 'bulk_sync', // Special identifier for bulk synced calls
              sid: call.Sid,
              callSid: call.Sid,
              parentCallSid: call.ParentCallSid,
              dateCreated: call.DateCreated,
              dateUpdated: call.DateUpdated,
              accountSid: call.AccountSid,
              toNumber: call.To,
              fromNumber: call.From,
              phoneNumberSid: call.PhoneNumberSid,
              status: call.Status,
              startTime: call.StartTime,
              endTime: call.EndTime,
              duration: call.Duration,
              price: call.Price,
              direction: call.Direction,
              answeredBy: call.AnsweredBy,
              uri: call.Uri,
              recordingUrl: call.RecordingUrl,
            },
          });

          this.logger.debug(`Created new call record: ${call.Sid}`);
        }

        syncedCount++;
      } catch (error) {
        this.logger.error(`Failed to reconcile call ${call.Sid}: ${error.message}`);
        // Continue with other calls
      }
    }

    return syncedCount;
  }

  /**
   * Update sync status
   */
  private async updateSyncStatus(
    syncType: string,
    lastSyncTime: Date,
    status: string,
    recordsSynced: number,
    errorMessage?: string
  ) {
    try {
      await this.prisma.syncStatus.create({
        data: {
          syncType,
          lastSyncTime,
          status,
          recordsSynced,
          errorMessage,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update sync status: ${error.message}`);
    }
  }

  /**
   * Get sync status history
   */
  async getSyncHistory(syncType?: string, limit: number = 50) {
    const where = syncType ? { syncType } : {};

    return this.prisma.syncStatus.findMany({
      where,
      orderBy: { lastSyncTime: 'desc' },
      take: limit,
    });
  }

  /**
   * Get last sync status
   */
  async getLastSyncStatus(syncType: string) {
    return this.prisma.syncStatus.findFirst({
      where: { syncType },
      orderBy: { lastSyncTime: 'desc' },
    });
  }

  /**
   * Manually trigger sync
   */
  async triggerManualSync() {
    this.logger.log('Manual bulk call details sync triggered');
    return this.syncBulkCallDetails();
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(startDate: Date, endDate: Date) {
    const syncs = await this.prisma.syncStatus.findMany({
      where: {
        lastSyncTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { lastSyncTime: 'desc' },
    });

    const total = syncs.length;
    const successful = syncs.filter(s => s.status === 'success').length;
    const failed = syncs.filter(s => s.status === 'failed').length;
    const totalRecordsSynced = syncs.reduce((sum, s) => sum + (s.recordsSynced || 0), 0);

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      totalRecordsSynced,
      syncs,
    };
  }
}
