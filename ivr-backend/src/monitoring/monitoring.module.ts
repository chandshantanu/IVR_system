import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HeartbeatService } from './heartbeat.service';
import { SyncService } from './sync.service';
import { MonitoringController } from './monitoring.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ExotelModule } from '../exotel/exotel.module';

/**
 * Monitoring Module
 * Handles Exotel monitoring (HeartBeat API, Bulk Call Details sync)
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    ExotelModule,
  ],
  controllers: [MonitoringController],
  providers: [HeartbeatService, SyncService],
  exports: [HeartbeatService, SyncService],
})
export class MonitoringModule {}
