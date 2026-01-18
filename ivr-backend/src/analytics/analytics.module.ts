import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { IvrModule } from '../ivr/ivr.module';
import { PhoneNumbersModule } from '../phone-numbers/phone-numbers.module';
import { ExotelModule } from '../exotel/exotel.module';

@Module({
  imports: [PrismaModule, IvrModule, PhoneNumbersModule, ExotelModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService]
})
export class AnalyticsModule {}
