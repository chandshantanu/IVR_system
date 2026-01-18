import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { RecordingsService } from './recordings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Recordings Controller
 * REST API for call recording access and management
 */
@ApiTags('Recordings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/exotel/recordings')
export class RecordingsController {
  constructor(private readonly recordingsService: RecordingsService) {}

  /**
   * Stream call recording
   * Acts as a secure proxy to Exotel's recording storage
   */
  @Get(':callSid/stream')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stream call recording (audio file)' })
  @ApiParam({ name: 'callSid', description: 'Unique call identifier' })
  @ApiResponse({ status: 200, description: 'Recording stream', type: 'audio/mpeg' })
  @ApiResponse({ status: 404, description: 'Recording not found' })
  async streamRecording(
    @Param('callSid') callSid: string,
    @Res() res: Response,
  ) {
    await this.recordingsService.streamRecording(callSid, res);
  }

  /**
   * Get recording metadata
   */
  @Get(':callSid/metadata')
  @ApiOperation({ summary: 'Get recording metadata and call details' })
  @ApiParam({ name: 'callSid', description: 'Unique call identifier' })
  @ApiResponse({ status: 200, description: 'Recording metadata' })
  @ApiResponse({ status: 404, description: 'Call not found' })
  async getRecordingMetadata(@Param('callSid') callSid: string) {
    return this.recordingsService.getRecordingMetadata(callSid);
  }

  /**
   * Get list of calls with recordings
   */
  @Get()
  @ApiOperation({ summary: 'Get list of calls with recordings' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'direction', required: false, enum: ['inbound', 'outbound'] })
  @ApiQuery({ name: 'phoneNumber', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of calls with recordings' })
  async getCallsWithRecordings(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('direction') direction?: string,
    @Query('phoneNumber') phoneNumber?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    return this.recordingsService.getCallsWithRecordings({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      direction,
      phoneNumber,
      limit,
      offset,
    });
  }

  /**
   * Delete recording reference
   * Note: This only removes the reference in our DB, doesn't delete from Exotel
   */
  @Delete(':callSid')
  @ApiOperation({ summary: 'Delete recording reference from database' })
  @ApiParam({ name: 'callSid', description: 'Unique call identifier' })
  @ApiResponse({ status: 200, description: 'Recording reference deleted' })
  @ApiResponse({ status: 404, description: 'Call not found' })
  async deleteRecordingReference(@Param('callSid') callSid: string) {
    return this.recordingsService.deleteRecordingReference(callSid);
  }
}
