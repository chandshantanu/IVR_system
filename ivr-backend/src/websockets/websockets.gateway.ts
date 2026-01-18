import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service';

/**
 * WebSocket Gateway for real-time updates
 * Provides real-time dashboard metrics, call status, and queue updates
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true
  }
})
export class WebSocketsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('WebSocketsGateway');
  private metricsInterval: NodeJS.Timeout;

  constructor(private analyticsService: AnalyticsService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    // Broadcast dashboard metrics every 5 seconds
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.analyticsService.getDashboardMetrics();
        this.server.emit('dashboard:metrics', metrics);
      } catch (error) {
        this.logger.error('Error broadcasting metrics:', error);
      }
    }, 5000);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Send initial metrics immediately
    this.sendInitialMetrics(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client requests to join a specific room (e.g., flow monitoring)
   */
  @SubscribeMessage('join:room')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
    client.emit('room:joined', { room });
  }

  /**
   * Client requests to leave a room
   */
  @SubscribeMessage('leave:room')
  handleLeaveRoom(client: Socket, room: string) {
    client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
    client.emit('room:left', { room });
  }

  /**
   * Send call started event
   */
  emitCallStarted(data: {
    callSid: string;
    flowId: number;
    flowName: string;
    callerNumber: string;
  }) {
    this.server.emit('call:started', data);
    this.logger.log(`Call started: ${data.callSid}`);
  }

  /**
   * Send call completed event
   */
  emitCallCompleted(data: {
    callSid: string;
    flowId: number;
    flowName: string;
    callerNumber: string;
    status: string;
    duration: number;
  }) {
    this.server.emit('call:completed', data);
    this.logger.log(`Call completed: ${data.callSid}`);
  }

  /**
   * Send queue update
   */
  emitQueueUpdate(queueId: number, data: {
    queueName: string;
    currentSize: number;
    longestWaitTime: number;
  }) {
    this.server.emit('queue:update', { queueId, ...data });
    this.server.to(`queue:${queueId}`).emit('queue:update', data);
  }

  /**
   * Send agent status update
   */
  emitAgentStatusUpdate(agentId: number, data: {
    agentName: string;
    status: string;
    currentCalls: number;
  }) {
    this.server.emit('agent:status', { agentId, ...data });
  }

  /**
   * Send flow execution update
   */
  emitFlowExecutionUpdate(flowId: number, data: {
    executionId: number;
    currentNodeId: number;
    nodeName: string;
  }) {
    this.server.to(`flow:${flowId}`).emit('flow:execution', data);
  }

  /**
   * Send initial metrics to newly connected client
   */
  private async sendInitialMetrics(client: Socket) {
    try {
      const metrics = await this.analyticsService.getDashboardMetrics();
      client.emit('dashboard:metrics', metrics);
    } catch (error) {
      this.logger.error('Error sending initial metrics:', error);
    }
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }
}
