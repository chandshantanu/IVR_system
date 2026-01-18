import { Module } from '@nestjs/common';
import { WebSocketsGateway } from './websockets.gateway';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [AnalyticsModule],
  providers: [WebSocketsGateway],
  exports: [WebSocketsGateway]
})
export class WebSocketsModule {}
