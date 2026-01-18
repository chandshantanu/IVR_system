import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExotelModule } from './exotel/exotel.module';
import { IvrModule } from './ivr/ivr.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { WebSocketsModule } from './websockets/websockets.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { PhoneNumbersModule } from './phone-numbers/phone-numbers.module';
import { DepartmentsModule } from './departments/departments.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ExotelModule,
    IvrModule,
    AnalyticsModule,
    WebSocketsModule,
    MonitoringModule,
    PhoneNumbersModule,
    DepartmentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
