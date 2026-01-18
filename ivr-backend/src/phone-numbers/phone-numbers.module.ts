import { Module } from '@nestjs/common';
import { PhoneNumbersService } from './phone-numbers.service';
import { PhoneNumbersController } from './phone-numbers.controller';
import { UserPhoneAssignmentService } from './user-phone-assignment.service';
import { UserPhoneAssignmentController } from './user-phone-assignment.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PhoneNumbersController, UserPhoneAssignmentController],
  providers: [PhoneNumbersService, UserPhoneAssignmentService],
  exports: [PhoneNumbersService, UserPhoneAssignmentService],
})
export class PhoneNumbersModule {}
