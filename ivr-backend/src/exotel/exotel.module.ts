import { Module } from '@nestjs/common';
import { ExotelService } from './exotel.service';
import { ExotelController } from './exotel.controller';
import { RecordingsService } from './recordings.service';
import { RecordingsController } from './recordings.controller';

@Module({
  controllers: [ExotelController, RecordingsController],
  providers: [ExotelService, RecordingsService],
  exports: [ExotelService, RecordingsService],
})
export class ExotelModule {}
