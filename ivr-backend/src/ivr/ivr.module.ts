import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { FlowsController } from './flows/flows.controller';
import { FlowsService } from './flows/flows.service';
import { BusinessHoursService } from './business-hours/business-hours.service';

/**
 * IVR Module (Simplified)
 *
 * Handles flow management (view-only - flows created on Exotel website)
 * and business hours configuration.
 *
 * Note: IVR execution engine removed since flows execute on Exotel's platform.
 * Call control (makeCall, sendSms) handled in ExotelModule.
 */
@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [FlowsController],
  providers: [
    FlowsService,
    BusinessHoursService
  ],
  exports: [
    FlowsService,
    BusinessHoursService
  ]
})
export class IvrModule {}
