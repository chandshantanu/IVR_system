import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { HeartbeatService } from './heartbeat.service';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

/**
 * Monitoring Controller
 * Exposes endpoints for Exotel monitoring features
 */
@Controller('api/monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MonitoringController {
  constructor(
    private heartbeatService: HeartbeatService,
    private syncService: SyncService,
  ) {}

  // ============================================================================
  // HeartBeat Endpoints
  // ============================================================================

  /**
   * Get current Exophone health status
   */
  @Get('health/current')
  @Roles('super_admin', 'admin', 'manager')
  async getCurrentHealth() {
    return this.heartbeatService.getCurrentHealth();
  }

  /**
   * Get Exophone health history
   */
  @Get('health/history')
  @Roles('super_admin', 'admin', 'manager')
  async getHealthHistory(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.heartbeatService.getHealthHistory(limitNum);
  }

  /**
   * Get health statistics for a date range
   */
  @Get('health/stats')
  @Roles('super_admin', 'admin', 'manager')
  async getHealthStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return this.heartbeatService.getHealthStats(start, end);
  }

  /**
   * Manually trigger health check
   */
  @Post('health/check')
  @Roles('super_admin', 'admin')
  async triggerHealthCheck() {
    await this.heartbeatService.triggerHealthCheck();
    return { message: 'Health check triggered successfully' };
  }

  // ============================================================================
  // Sync Endpoints
  // ============================================================================

  /**
   * Get last sync status
   */
  @Get('sync/status')
  @Roles('super_admin', 'admin', 'manager')
  async getLastSyncStatus(@Query('type') type?: string) {
    const syncType = type || 'bulk_call_details';
    return this.syncService.getLastSyncStatus(syncType);
  }

  /**
   * Get sync history
   */
  @Get('sync/history')
  @Roles('super_admin', 'admin', 'manager')
  async getSyncHistory(
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.syncService.getSyncHistory(type, limitNum);
  }

  /**
   * Get sync statistics
   */
  @Get('sync/stats')
  @Roles('super_admin', 'admin', 'manager')
  async getSyncStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return this.syncService.getSyncStats(start, end);
  }

  /**
   * Manually trigger sync
   */
  @Post('sync/trigger')
  @Roles('super_admin', 'admin')
  async triggerManualSync() {
    await this.syncService.triggerManualSync();
    return { message: 'Sync triggered successfully' };
  }
}
