import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Res,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  Request
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PhoneNumberAccessGuard } from '../phone-numbers/guards/phone-number-access.guard';
import { CallbackCallerDto } from './dto/callback-caller.dto';

/**
 * Analytics Controller - REST API for analytics and reporting
 * Access control: Users can only see analytics for their assigned phone numbers
 */
@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PhoneNumberAccessGuard)
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get dashboard metrics
   * Access control: Filtered by user's assigned phone numbers
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'Get real-time dashboard metrics' })
  @ApiQuery({ name: 'phoneNumber', required: false, description: 'Filter metrics by phone number' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics' })
  async getDashboardMetrics(
    @Query('phoneNumber') phoneNumber?: string,
    @Request() req?: any
  ) {
    const accessiblePhoneNumbers = req.accessiblePhoneNumbers;
    return this.analyticsService.getDashboardMetrics(phoneNumber, accessiblePhoneNumbers);
  }

  /**
   * Get call metrics for date range
   * Access control: Filtered by user's assigned phone numbers
   */
  @Get('calls/metrics')
  @ApiOperation({ summary: 'Get call metrics for date range' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Call metrics' })
  async getCallMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?: any
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const accessiblePhoneNumbers = req.accessiblePhoneNumbers;

    return this.analyticsService.getCallMetrics(start, end, accessiblePhoneNumbers);
  }

  /**
   * Get call history with filters
   * Access control: Filtered by user's assigned phone numbers
   */
  @Get('calls/history')
  @ApiOperation({ summary: 'Get call history with filters' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'flowId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'callerNumber', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async getCallHistory(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('flowId') flowIdStr?: string,
    @Query('status') status?: string,
    @Query('callerNumber') callerNumber?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
    @Request() req?: any
  ) {
    const accessiblePhoneNumbers = req.accessiblePhoneNumbers;

    // Parse numeric parameters manually
    const flowId = flowIdStr ? parseInt(flowIdStr, 10) : undefined;
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    return this.analyticsService.getCallHistory({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      flowId,
      status,
      callerNumber,
      limit,
      offset,
      accessiblePhoneNumbers
    });
  }

  /**
   * Click-to-call: Call back a caller from call history
   * Initiates a call from agent to the original caller
   */
  @Post('calls/callback')
  @ApiOperation({
    summary: 'Call back a caller from call history',
    description: 'Initiates a click-to-call to connect the agent with the original caller. The caller number is masked for privacy.'
  })
  @ApiResponse({ status: 200, description: 'Callback initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid phone number' })
  async callbackCaller(
    @Body() callbackDto: CallbackCallerDto,
    @Request() req?: any
  ) {
    const user = req.user;
    return this.analyticsService.initiateCallback(callbackDto, user);
  }

  /**
   * Export call history to CSV
   * Access control: Filtered by user's assigned phone numbers
   */
  @Get('calls/export/csv')
  @ApiOperation({ summary: 'Export call history to CSV' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'flowId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async exportCallHistory(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('flowId', new ParseIntPipe({ optional: true })) flowId?: number,
    @Query('status') status?: string,
    @Res() res?: Response,
    @Request() req?: any
  ) {
    const accessiblePhoneNumbers = req.accessiblePhoneNumbers;
    const csv = await this.analyticsService.exportCallHistoryToCsv({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      flowId,
      status,
      accessiblePhoneNumbers
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=call-history-${Date.now()}.csv`);
    res.status(HttpStatus.OK).send(csv);
  }

  /**
   * Get flow analytics
   * Access control: Filtered by user's assigned phone numbers
   */
  @Get('flows/:id/analytics')
  @ApiOperation({ summary: 'Get analytics for a specific flow' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getFlowAnalytics(
    @Param('id') idStr: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?: any
  ) {
    const accessiblePhoneNumbers = req.accessiblePhoneNumbers;
    const flowId = parseInt(idStr, 10);

    return this.analyticsService.getFlowAnalytics(
      flowId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      accessiblePhoneNumbers
    );
  }

  /**
   * Get agent performance metrics
   * Access control: Filtered by user's assigned phone numbers
   */
  @Get('agents/performance')
  @ApiOperation({ summary: 'Get agent performance metrics' })
  @ApiQuery({ name: 'agentId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getAgentPerformance(
    @Query('agentId') agentIdStr?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?: any
  ) {
    const accessiblePhoneNumbers = req.accessiblePhoneNumbers;

    // Parse agentId manually to avoid validation errors when not provided
    const agentId = agentIdStr ? parseInt(agentIdStr, 10) : undefined;

    return this.analyticsService.getAgentPerformance(
      agentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      accessiblePhoneNumbers
    );
  }
}
