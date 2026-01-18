import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios, { AxiosInstance } from 'axios';
import { Response } from 'express';

/**
 * Recordings Service
 * Handles call recording download, streaming, and management
 */
@Injectable()
export class RecordingsService {
  private readonly logger = new Logger(RecordingsService.name);
  private readonly httpClient: AxiosInstance;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // Create HTTP client for downloading recordings from Exotel
    this.httpClient = axios.create({
      timeout: 60000, // 60 seconds for large recordings
      responseType: 'stream', // Stream the response
    });
  }

  /**
   * Get authentication credentials for Exotel API
   */
  private getAuthCredentials(): { apiKey: string; apiSecret: string } {
    const apiKey = this.configService.get<string>('EXOTEL_API_KEY');
    const apiSecret = this.configService.get<string>('EXOTEL_API_SECRET');

    if (!apiKey || !apiSecret) {
      throw new Error('Missing Exotel API credentials');
    }

    return { apiKey, apiSecret };
  }

  /**
   * Get recording URL for a call
   * @param callSid Unique call identifier
   * @returns Recording URL from database
   */
  async getRecordingUrl(callSid: string): Promise<string> {
    this.logger.log(`Getting recording URL for CallSid: ${callSid}`);

    // Check VoiceCallback table
    const voiceCallback = await this.prisma.voiceCallback.findUnique({
      where: { callSid },
      select: { recordingUrl: true, status: true },
    });

    if (!voiceCallback) {
      throw new NotFoundException(`Call not found: ${callSid}`);
    }

    if (!voiceCallback.recordingUrl) {
      throw new NotFoundException(`No recording available for call: ${callSid}`);
    }

    return voiceCallback.recordingUrl;
  }

  /**
   * Stream recording from Exotel to client
   * This acts as a proxy to avoid exposing Exotel URLs directly
   * @param callSid Unique call identifier
   * @param res Express response object
   */
  async streamRecording(callSid: string, res: Response): Promise<void> {
    this.logger.log(`Streaming recording for CallSid: ${callSid}`);

    try {
      // Get recording URL from database
      const recordingUrl = await this.getRecordingUrl(callSid);

      // Get auth credentials
      const { apiKey, apiSecret } = this.getAuthCredentials();
      const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

      this.logger.debug(`Downloading recording from: ${recordingUrl}`);

      // Stream the recording from Exotel
      const response = await this.httpClient.get(recordingUrl, {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
        responseType: 'stream',
      });

      // Set appropriate headers
      res.setHeader('Content-Type', response.headers['content-type'] || 'audio/mpeg');
      res.setHeader('Content-Length', response.headers['content-length'] || '0');
      res.setHeader('Content-Disposition', `inline; filename="recording-${callSid}.mp3"`);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.setHeader('Accept-Ranges', 'bytes'); // Enable seeking in audio player

      // Stream the response
      response.data.pipe(res);

      this.logger.log(`Recording streamed successfully for CallSid: ${callSid}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Error streaming recording: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to stream recording: ${error.message}`);
    }
  }

  /**
   * Get recording metadata
   * @param callSid Unique call identifier
   * @returns Recording metadata
   */
  async getRecordingMetadata(callSid: string) {
    this.logger.log(`Getting recording metadata for CallSid: ${callSid}`);

    const voiceCallback = await this.prisma.voiceCallback.findUnique({
      where: { callSid },
      select: {
        id: true,
        callSid: true,
        recordingUrl: true,
        status: true,
        duration: true,
        startTime: true,
        endTime: true,
        fromNumber: true,
        toNumber: true,
        direction: true,
        createdAt: true,
      },
    });

    if (!voiceCallback) {
      throw new NotFoundException(`Call not found: ${callSid}`);
    }

    const hasRecording = !!voiceCallback.recordingUrl;

    return {
      callSid: voiceCallback.callSid,
      hasRecording,
      recordingUrl: hasRecording ? `/api/exotel/recordings/${callSid}/stream` : null,
      status: voiceCallback.status,
      duration: voiceCallback.duration,
      startTime: voiceCallback.startTime,
      endTime: voiceCallback.endTime,
      fromNumber: voiceCallback.fromNumber,
      toNumber: voiceCallback.toNumber,
      direction: voiceCallback.direction,
      createdAt: voiceCallback.createdAt,
    };
  }

  /**
   * Get list of calls with recordings
   * @param filters Optional filters for the query
   * @returns List of calls with recording metadata
   */
  async getCallsWithRecordings(filters: {
    startDate?: Date;
    endDate?: Date;
    direction?: string;
    phoneNumber?: string;
    limit?: number;
    offset?: number;
  }) {
    this.logger.log('Getting calls with recordings');

    const { startDate, endDate, direction, phoneNumber, limit = 50, offset = 0 } = filters;

    const where: any = {
      recordingUrl: { not: null }, // Only calls with recordings
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (direction) {
      where.direction = direction;
    }

    if (phoneNumber) {
      where.OR = [
        { fromNumber: { contains: phoneNumber } },
        { toNumber: { contains: phoneNumber } },
      ];
    }

    const [calls, total] = await Promise.all([
      this.prisma.voiceCallback.findMany({
        where,
        select: {
          id: true,
          callSid: true,
          status: true,
          duration: true,
          startTime: true,
          endTime: true,
          fromNumber: true,
          toNumber: true,
          direction: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.voiceCallback.count({ where }),
    ]);

    return {
      calls: calls.map(call => ({
        ...call,
        recordingUrl: `/api/exotel/recordings/${call.callSid}/stream`,
      })),
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete recording reference (doesn't delete from Exotel, just clears URL)
   * @param callSid Unique call identifier
   */
  async deleteRecordingReference(callSid: string) {
    this.logger.log(`Deleting recording reference for CallSid: ${callSid}`);

    const voiceCallback = await this.prisma.voiceCallback.findUnique({
      where: { callSid },
    });

    if (!voiceCallback) {
      throw new NotFoundException(`Call not found: ${callSid}`);
    }

    await this.prisma.voiceCallback.update({
      where: { callSid },
      data: { recordingUrl: null },
    });

    this.logger.log(`Recording reference deleted for CallSid: ${callSid}`);

    return { message: 'Recording reference deleted successfully' };
  }
}
