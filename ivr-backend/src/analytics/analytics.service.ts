import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExotelService } from '../exotel/exotel.service';
import { mapCallStatus, parseDuration } from './call-status-mapper';
import { maskPhoneNumber, isValidPhoneNumber } from '../common/utils/phone.util';
import { CallbackCallerDto } from './dto/callback-caller.dto';

/**
 * Dashboard Metrics
 */
export interface DashboardMetrics {
  activeCalls: number;
  callsInQueue: number;
  availableAgents: number;
  totalAgents: number;
  callsToday: number;
  completedCalls: number;
  missedCalls: number;
  abandonedCalls: number;
  failedCalls: number;
  avgCallDuration: number;
  successRate: number;
  topFlows: Array<{ flowName: string; callCount: number }>;
}

/**
 * Call Metrics
 */
export interface CallMetrics {
  totalCalls: number;
  completedCalls: number;
  missedCalls: number;
  abandonedCalls: number;
  failedCalls: number;
  averageDuration: number;
  peakHour: number;
  callsByHour: Array<{ hour: number; count: number }>;
}

/**
 * Analytics Service - Provides call metrics and reporting
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private prisma: PrismaService,
    private exotelService: ExotelService
  ) {}

  /**
   * Get dashboard metrics
   * @param phoneNumber Optional phone number filter
   * @param accessiblePhoneNumbers Phone numbers accessible to user (null for admins)
   * @returns Real-time dashboard metrics
   */
  async getDashboardMetrics(phoneNumber?: string, accessiblePhoneNumbers?: string[] | null): Promise<DashboardMetrics> {
    try {
      this.logger.log(`Fetching dashboard metrics${phoneNumber ? ` for ${phoneNumber}` : ''}${accessiblePhoneNumbers ? ` (filtered by ${accessiblePhoneNumbers.length} numbers)` : ''}`);

      // Get active calls from database (calls in progress)
      // Since we removed Redis state manager, query recent calls that haven't ended
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const activeCalls = await this.prisma.voiceCallback.count({
        where: {
          status: {
            in: ['in-progress', 'ringing', 'answered']
          },
          createdAt: { gte: fiveMinutesAgo }
        }
      });

    // Get calls in queue
    const callsInQueue = await this.prisma.callQueueEntry.count({
      where: { exitReason: null }
    });

    // Get agent stats
    const totalAgents = await this.prisma.agent.count();
    const availableAgents = await this.prisma.agent.count({
      where: { status: 'available' }
    });

    // Get today's call count from VoiceCallback (actual call data from Exotel)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Build where clause for VoiceCallback table
    const callWhere: any = {
      createdAt: { gte: todayStart }
    };

    // Apply access control: filter by accessible phone numbers (toNumber for inbound)
    if (accessiblePhoneNumbers !== null) {
      // Regular users: filter by accessible phone numbers
      if (phoneNumber) {
        // If specific phoneNumber requested, ensure user has access to it
        if (accessiblePhoneNumbers && accessiblePhoneNumbers.includes(phoneNumber)) {
          callWhere.toNumber = phoneNumber;
        } else {
          // User doesn't have access to requested phone number
          callWhere.toNumber = { in: accessiblePhoneNumbers || [] };
        }
      } else {
        // No specific phoneNumber, filter by all accessible numbers
        callWhere.toNumber = { in: accessiblePhoneNumbers || [] };
      }
    } else {
      // Admins: no filtering, but can still filter by specific phoneNumber if provided
      if (phoneNumber) {
        callWhere.toNumber = phoneNumber;
      }
    }

    const callsToday = await this.prisma.voiceCallback.count({
      where: callWhere
    });

    // Get all today's calls for detailed analysis
    const allCalls = await this.prisma.voiceCallback.findMany({
      where: callWhere,
      select: {
        status: true,
        duration: true,
        recordingUrl: true,
        answeredBy: true
      }
    });

    // Categorize calls based on our smart status mapping logic
    let completedCalls = 0;
    let missedCalls = 0;
    let abandonedCalls = 0;
    let failedCalls = 0;
    let totalDuration = 0;

    allCalls.forEach(call => {
      const duration = parseDuration(call.duration);
      const statusInfo = mapCallStatus(call.status, call.answeredBy, call.recordingUrl, duration);

      if (statusInfo.category === 'success') {
        completedCalls++;
        if (duration) totalDuration += duration;
      } else if (statusInfo.displayStatus === 'missed') {
        missedCalls++;
      } else if (statusInfo.category === 'abandoned') {
        abandonedCalls++;
      } else if (statusInfo.category === 'failed') {
        failedCalls++;
      }
    });

    const avgCallDuration = completedCalls > 0 ? Math.round(totalDuration / completedCalls) : 0;
    const successRate = callsToday > 0 ? (completedCalls / callsToday) * 100 : 0;

    // Get call distribution by direction (inbound/outbound)
    const callsByDirection = await this.prisma.voiceCallback.groupBy({
      by: ['direction'],
      where: callWhere,
      _count: true,
      orderBy: {
        _count: {
          direction: 'desc'
        }
      },
      take: 5
    });

    const topFlows = callsByDirection.map((cd) => ({
      flowName: cd.direction === 'inbound' ? 'Inbound Calls' : 'Outbound Calls',
      callCount: cd._count
    }));

      return {
        activeCalls,
        callsInQueue,
        availableAgents,
        totalAgents,
        callsToday,
        completedCalls,
        missedCalls,
        abandonedCalls,
        failedCalls,
        avgCallDuration,
        successRate: Math.round(successRate * 10) / 10,
        topFlows
      };
    } catch (error) {
      this.logger.error('Failed to fetch dashboard metrics', error.stack);
      throw new InternalServerErrorException('Failed to fetch dashboard metrics');
    }
  }

  /**
   * Get call metrics for a date range
   * @param accessiblePhoneNumbers Phone numbers accessible to user (null for admins)
   */
  async getCallMetrics(startDate: Date, endDate: Date, accessiblePhoneNumbers?: string[] | null): Promise<CallMetrics> {
    const baseWhere: any = {
      createdAt: { gte: startDate, lte: endDate }
    };

    // Apply access control
    if (accessiblePhoneNumbers !== null && accessiblePhoneNumbers) {
      baseWhere.toNumber = { in: accessiblePhoneNumbers };
    }

    const totalCalls = await this.prisma.voiceCallback.count({
      where: baseWhere
    });

    // Get all calls for categorization
    const allCalls = await this.prisma.voiceCallback.findMany({
      where: baseWhere,
      select: {
        status: true,
        duration: true,
        recordingUrl: true,
        answeredBy: true,
        createdAt: true
      }
    });

    // Categorize calls using smart status mapping
    let completedCalls = 0;
    let missedCalls = 0;
    let abandonedCalls = 0;
    let failedCalls = 0;
    let totalDuration = 0;

    allCalls.forEach(call => {
      const duration = parseDuration(call.duration);
      const statusInfo = mapCallStatus(call.status, call.answeredBy, call.recordingUrl, duration);

      if (statusInfo.category === 'success') {
        completedCalls++;
        if (duration) totalDuration += duration;
      } else if (statusInfo.displayStatus === 'missed') {
        missedCalls++;
      } else if (statusInfo.category === 'abandoned') {
        abandonedCalls++;
      } else if (statusInfo.category === 'failed') {
        failedCalls++;
      }
    });

    const averageDuration = completedCalls > 0 ? Math.round(totalDuration / completedCalls) : 0;

    // Get calls by hour
    const calls = await this.prisma.voiceCallback.findMany({
      where: baseWhere,
      select: {
        createdAt: true
      }
    });

    const hourlyData: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = 0;
    }

    calls.forEach(call => {
      const hour = call.createdAt.getHours();
      hourlyData[hour] = (hourlyData[hour] || 0) + 1;
    });

    const callsByHour = Object.entries(hourlyData).map(([hour, count]) => ({
      hour: parseInt(hour),
      count
    }));

    const peakHour = callsByHour.reduce((max, curr) =>
      curr.count > max.count ? curr : max
    , { hour: 0, count: 0 }).hour;

    return {
      totalCalls,
      completedCalls,
      missedCalls,
      abandonedCalls,
      failedCalls,
      averageDuration,
      peakHour,
      callsByHour
    };
  }

  /**
   * Get phone number mapping for department names
   * @private
   * @returns Map of phone number to department name
   */
  private async getPhoneNumberMapping(): Promise<Map<string, string>> {
    const phoneNumbers = await this.prisma.phoneNumber.findMany({
      select: {
        number: true,
        departmentName: true,
      },
    });

    return new Map(phoneNumbers.map(p => [p.number, p.departmentName || 'Unknown Department']));
  }

  /**
   * Get call history with filters
   */
  async getCallHistory(filters: {
    startDate?: Date;
    endDate?: Date;
    flowId?: number;
    status?: string;
    callerNumber?: string;
    limit?: number;
    offset?: number;
    accessiblePhoneNumbers?: string[] | null;
  }) {
    const where: any = {};

    // Fetch phone number mapping once
    const phoneMapping = await this.getPhoneNumberMapping();

    // Use createdAt for VoiceCallback (matches when call was received)
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    // Search in fromNumber for caller number
    if (filters.callerNumber) {
      where.fromNumber = { contains: filters.callerNumber };
    }

    // Apply access control - filter by toNumber (called number)
    if (filters.accessiblePhoneNumbers !== null && filters.accessiblePhoneNumbers) {
      where.toNumber = { in: filters.accessiblePhoneNumbers };
    }

    // Query VoiceCallback table for ALL call data
    const [calls, total] = await Promise.all([
      this.prisma.voiceCallback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
        select: {
          id: true,
          callSid: true,
          fromNumber: true,
          toNumber: true,
          status: true,
          startTime: true,
          endTime: true,
          duration: true,
          direction: true,
          recordingUrl: true,
          answeredBy: true,
          createdAt: true,
          dateCreated: true,
        }
      }),
      this.prisma.voiceCallback.count({ where })
    ]);

    // Transform VoiceCallback data to match expected CallHistory format
    const transformedCalls = calls.map(call => {
      const durationSeconds = parseDuration(call.duration);
      const statusInfo = mapCallStatus(
        call.status,
        call.answeredBy,
        call.recordingUrl,
        durationSeconds
      );

      // Get department/flow name from phone number mapping
      const calledPhoneName = phoneMapping.get(call.toNumber) || 'Unknown Department';

      // Mask ONLY the caller number for privacy (every alternate digit replaced with 'x')
      // Do NOT mask the called number (that's our own department number)
      const maskedCallerNumber = call.fromNumber ? maskPhoneNumber(call.fromNumber) : 'Unknown';

      return {
        id: call.id,
        callSid: call.callSid,
        callerNumber: maskedCallerNumber,  // Use masked caller number
        calledNumber: call.toNumber || 'Unknown',  // Keep department number unmasked
        callerNumberUnmasked: call.fromNumber || 'Unknown',  // Original for click-to-call
        status: statusInfo.displayStatus,
        statusCategory: statusInfo.category,
        statusDescription: statusInfo.description,
        startedAt: call.startTime || call.dateCreated || call.createdAt.toISOString(),
        endedAt: call.endTime || null,
        durationSeconds,
        recordingUrl: call.recordingUrl,
        direction: call.direction,
        answeredBy: call.answeredBy,
        flow: {
          id: 0, // No flow association for direct Exotel calls
          name: calledPhoneName  // Use ExoPhone friendly name instead of "Inbound Call"
        }
      };
    });

    return {
      calls: transformedCalls,
      total,
      page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
      pageSize: filters.limit || 50
    };
  }

  /**
   * Export call history to CSV
   */
  async exportCallHistoryToCsv(filters: {
    startDate?: Date;
    endDate?: Date;
    flowId?: number;
    status?: string;
    accessiblePhoneNumbers?: string[] | null;
  }): Promise<string> {
    const { calls } = await this.getCallHistory({ ...filters, limit: 10000 });

    // CSV header
    let csv = 'Call SID,Direction,Caller Number,Called Number,Status,Started At,Ended At,Duration (seconds),Answered By,Recording URL\n';

    // CSV rows
    for (const call of calls) {
      csv += `"${call.callSid}",`;
      csv += `"${call.direction || 'N/A'}",`;
      csv += `"${call.callerNumber}",`;
      csv += `"${call.calledNumber}",`;
      csv += `"${call.status}",`;
      csv += `"${call.startedAt}",`;
      csv += `"${call.endedAt || ''}",`;
      csv += `"${call.durationSeconds || 0}",`;
      csv += `"${call.answeredBy || ''}",`;
      csv += `"${call.recordingUrl || ''}"\n`;
    }

    return csv;
  }

  /**
   * Get flow analytics
   * @param accessiblePhoneNumbers Phone numbers accessible to user (null for admins)
   */
  async getFlowAnalytics(flowId: number, startDate?: Date, endDate?: Date, accessiblePhoneNumbers?: string[] | null) {
    const where: any = { flowId };

    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) where.startedAt.gte = startDate;
      if (endDate) where.startedAt.lte = endDate;
    }

    // Apply access control
    if (accessiblePhoneNumbers !== null && accessiblePhoneNumbers) {
      where.calledNumber = { in: accessiblePhoneNumbers };
    }

    const totalExecutions = await this.prisma.flowExecution.count({ where });

    const completed = await this.prisma.flowExecution.count({
      where: { ...where, status: 'completed' }
    });

    const failed = await this.prisma.flowExecution.count({
      where: { ...where, status: 'failed' }
    });

    const avgDuration = await this.prisma.flowExecution.aggregate({
      where: { ...where, status: 'completed' },
      _avg: { durationSeconds: true }
    });

    // Get most visited nodes
    const nodeExecutions = await this.prisma.nodeExecution.groupBy({
      by: ['nodeId'],
      where: {
        execution: where
      },
      _count: true,
      orderBy: {
        _count: {
          nodeId: 'desc'
        }
      },
      take: 10
    });

    const topNodes = await Promise.all(
      nodeExecutions.map(async (ne) => {
        const node = await this.prisma.flowNode.findUnique({
          where: { id: ne.nodeId }
        });
        return {
          nodeName: node?.name || 'Unknown Node',
          nodeType: node?.nodeType || 'unknown',
          visitCount: ne._count
        };
      })
    );

    return {
      flowId,
      totalExecutions,
      completed,
      failed,
      successRate: totalExecutions > 0 ? (completed / totalExecutions) * 100 : 0,
      averageDuration: Math.round(avgDuration._avg.durationSeconds || 0),
      topNodes
    };
  }

  /**
   * Get agent performance metrics
   * @param accessiblePhoneNumbers Phone numbers accessible to user (null for admins)
   */
  async getAgentPerformance(agentId?: number, startDate?: Date, endDate?: Date, accessiblePhoneNumbers?: string[] | null) {
    const where: any = {};

    if (startDate || endDate) {
      where.enteredAt = {};
      if (startDate) where.enteredAt.gte = startDate;
      if (endDate) where.enteredAt.lte = endDate;
    }

    // Apply access control via nested relation
    if (accessiblePhoneNumbers !== null && accessiblePhoneNumbers) {
      where.execution = {
        calledNumber: { in: accessiblePhoneNumbers }
      };
    }

    // Get all agents or specific agent
    const agentWhere: any = {};
    if (agentId) {
      agentWhere.id = agentId;
    }

    const agents = await this.prisma.agent.findMany({
      where: agentWhere,
      select: {
        id: true,
        agentName: true,
        email: true,
        status: true,
      }
    });

    // Build performance data for each agent
    const agentPerformanceData = await Promise.all(
      agents.map(async (agent) => {
        const agentWhere = {
          ...where,
          assignedAgentId: agent.id,
        };

        const totalCalls = await this.prisma.callQueueEntry.count({
          where: { ...agentWhere, exitReason: 'connected' }
        });

        const avgWaitTime = await this.prisma.callQueueEntry.aggregate({
          where: { ...agentWhere, exitReason: 'connected' },
          _avg: { waitTimeSeconds: true }
        });

        // Get average call duration from FlowExecution via executionId
        const callDurations = await this.prisma.callQueueEntry.findMany({
          where: { ...agentWhere, exitReason: 'connected' },
          select: {
            execution: {
              select: {
                durationSeconds: true
              }
            }
          }
        });

        const validDurations = callDurations
          .map(entry => entry.execution?.durationSeconds)
          .filter(duration => duration != null) as number[];

        const avgCallDuration = validDurations.length > 0
          ? validDurations.reduce((sum, duration) => sum + duration, 0) / validDurations.length
          : 0;

        const abandonedCalls = await this.prisma.callQueueEntry.count({
          where: { ...agentWhere, exitReason: 'abandoned' }
        });

        return {
          agentId: agent.id,
          agentName: agent.agentName,
          email: agent.email || '',
          status: agent.status || 'offline',
          totalCalls,
          averageWaitTime: Math.round(avgWaitTime._avg.waitTimeSeconds || 0),
          averageCallDuration: Math.round(avgCallDuration),
          abandonedCalls,
          abandonmentRate: totalCalls > 0 ? Math.round((abandonedCalls / totalCalls) * 100) : 0,
        };
      })
    );

    return agentPerformanceData;
  }

  /**
   * Initiate a callback to a caller from call history (Click-to-call)
   * Connects the agent to the original caller using Exotel's Connect Call API
   * The caller's number is masked for privacy in the response
   *
   * @param callbackDto - Contains caller number and optional agent number
   * @param user - Current authenticated user (agent)
   * @returns Call initiation response with masked caller number
   */
  async initiateCallback(callbackDto: CallbackCallerDto, user: any) {
    this.logger.log(`Initiating callback to ${callbackDto.callerNumber} for user ${user.username}`);

    // Validate caller number
    if (!isValidPhoneNumber(callbackDto.callerNumber)) {
      throw new BadRequestException('Invalid caller phone number');
    }

    // Get agent's phone number
    // Priority: 1) Provided in DTO, 2) User's profile, 3) Use default
    let agentNumber = callbackDto.agentNumber;

    if (!agentNumber) {
      // Try to get from user's phone number assignment
      const userPhoneAssignment = await this.prisma.userPhoneNumberAssignment.findFirst({
        where: {
          userId: user.sub || user.id,
        },
        include: {
          phoneNumber: true,
        },
      });

      if (userPhoneAssignment?.phoneNumber) {
        agentNumber = userPhoneAssignment.phoneNumber.number;
      }
    }

    if (!agentNumber) {
      throw new BadRequestException('Agent phone number not found. Please provide agentNumber or configure your phone number in settings.');
    }

    // Validate agent number
    if (!isValidPhoneNumber(agentNumber)) {
      throw new BadRequestException('Invalid agent phone number');
    }

    try {
      // Call Exotel's connect call API
      // From: Agent's phone (receives call first)
      // To: Caller's phone (gets connected after agent picks up)
      const exotelResponse = await this.exotelService.connectCall(
        agentNumber,
        callbackDto.callerNumber
      );

      // Mask the caller number for privacy in the response
      const maskedCallerNumber = maskPhoneNumber(callbackDto.callerNumber);

      this.logger.log(`Callback initiated successfully to ${maskedCallerNumber}`);

      return {
        success: true,
        message: 'Callback initiated successfully',
        data: {
          callSid: exotelResponse.Call?.Sid || exotelResponse.call?.sid,
          maskedCallerNumber,
          agentNumber: maskPhoneNumber(agentNumber),
          status: exotelResponse.Call?.Status || exotelResponse.call?.status,
          originalCallId: callbackDto.originalCallId,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to initiate callback: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to initiate callback. Please try again.');
    }
  }
}
