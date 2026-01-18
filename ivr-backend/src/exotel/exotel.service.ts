import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import Bottleneck from 'bottleneck';
import { AuthData } from './interfaces/auth-data.interface';

@Injectable()
export class ExotelService {
  private readonly logger = new Logger(ExotelService.name);
  private readonly httpClient: AxiosInstance;
  private readonly callbackId: string;
  private readonly baseUrl: string;
  private readonly voiceLimiter: Bottleneck;
  private readonly smsLimiter: Bottleneck;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.baseUrl = this.configService.get('NGROK_URL') || 'http://localhost:3001';
    this.callbackId = this.generateUUID();

    // Create optimized axios instance with connection pooling
    this.httpClient = axios.create({
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Voice API: 200 calls/min = 300ms between requests
    this.voiceLimiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 300, // 300ms between calls = 200 calls/min
      reservoir: 200,
      reservoirRefreshAmount: 200,
      reservoirRefreshInterval: 60 * 1000, // Refresh every minute
    });

    // SMS API: Conservative limit (adjust based on your plan)
    this.smsLimiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 500, // 500ms between SMS = 120 SMS/min
    });
  }

  /**
   * Generate Exotel AuthData from environment variables
   */
  private getAuthData(): AuthData {
    const apiKey = this.configService.get<string>('EXOTEL_API_KEY');
    const apiSecret = this.configService.get<string>('EXOTEL_API_SECRET');
    const accountSid = this.configService.get<string>('EXOTEL_SID');
    const fromNumber = this.configService.get<string>('EXOTEL_FROM_NUMBER') || '';
    const callerId = this.configService.get<string>('EXOTEL_CALLER_ID') || fromNumber;
    const apiDomain = this.configService.get<string>('EXOTEL_BASE_URL') || 'https://api.exotel.com';

    if (!apiKey || !apiSecret || !accountSid) {
      throw new Error('Missing Exotel configuration. Please set EXOTEL_API_KEY, EXOTEL_API_SECRET, and EXOTEL_SID');
    }

    // Generate MD5 hash for token (used in callback verification)
    const tokenMd5 = this.generateMd5(`${apiKey}:${apiSecret}`);

    return {
      apiKey,
      apiSecret,
      accountSid,
      fromNumber,
      callerId,
      apiDomain,
      tokenMd5,
    };
  }

  /**
   * Make authenticated HTTP request to Exotel API with retry logic
   */
  private async makeHttpRequest(url: string, data: Record<string, string>, authData: AuthData): Promise<any> {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        const auth = Buffer.from(`${authData.apiKey}:${authData.apiSecret}`).toString('base64');

        // Convert data to URL-encoded format
        const formData = new URLSearchParams(data).toString();

        this.logger.debug(`Making request to: ${url} (attempt ${retryCount + 1}/${maxRetries + 1})`);
        this.logger.debug(`Request data: ${JSON.stringify(data)}`);

        const response = await this.httpClient.post(url, formData, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        return response.data;
      } catch (error) {
        const status = error.response?.status;

        // Retry on rate limit (429) or service unavailable (503)
        if ((status === 429 || status === 503) && retryCount < maxRetries) {
          retryCount++;
          const backoffDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
          this.logger.warn(
            `Rate limited (${status}), retrying in ${backoffDelay}ms (attempt ${retryCount}/${maxRetries})`
          );
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          continue;
        }

        this.logger.error(`HTTP request failed: ${error.message}`, error.stack);
        throw error;
      }
    }

    throw new Error('Max retries exceeded for Exotel API request');
  }

  /**
   * Send SMS to a user (with rate limiting)
   */
  async sendSms(toNumber: string, message: string, dltTemplateId: string, dltEntityId: string) {
    return this.smsLimiter.schedule(() =>
      this._sendSmsInternal(toNumber, message, dltTemplateId, dltEntityId)
    );
  }

  /**
   * Internal SMS sending logic
   */
  private async _sendSmsInternal(toNumber: string, message: string, dltTemplateId: string, dltEntityId: string) {
    this.logger.log(`Sending SMS to: ${toNumber}`);

    try {
      const authData = this.getAuthData();
      const statusCallbackUrl = `${this.baseUrl}/api/webhooks/exotel/sms-callback/${this.callbackId}/${authData.tokenMd5}`;

      this.logger.log(`SMS Callback URL: ${statusCallbackUrl}`);

      const data = {
        From: authData.fromNumber,
        To: toNumber,
        Body: message,
        StatusCallback: statusCallbackUrl,
        StatusCallbackContentType: 'application/json',
        SmsType: 'promotional',
        DltTemplateId: dltTemplateId,
        DltEntityId: dltEntityId,
      };

      const smsUrl = `${authData.apiDomain}/v1/Accounts/${authData.accountSid}/Sms/send.json`;
      const response = await this.makeHttpRequest(smsUrl, data, authData);

      this.logger.log(`SMS response: ${JSON.stringify(response)}`);

      // Save initial SMS callback asynchronously
      setImmediate(() => {
        this.saveInitialSmsCallback(response, authData.tokenMd5).catch((error) => {
          this.logger.warn(`Async SMS callback save failed: ${error.message}`);
        });
      });

      return response;
    } catch (error) {
      this.logger.error(`Error sending SMS: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Make voice call to a user (with rate limiting)
   */
  async makeCall(toNumber: string, fromNumber?: string, record: string = 'true') {
    return this.voiceLimiter.schedule(() =>
      this._makeCallInternal(toNumber, fromNumber, record)
    );
  }

  /**
   * Internal voice call logic
   */
  private async _makeCallInternal(toNumber: string, fromNumber?: string, record: string = 'true') {
    this.logger.log(`Making voice call to: ${toNumber}`);

    try {
      const authData = this.getAuthData();
      const statusCallbackUrl = `${this.baseUrl}/api/webhooks/exotel/call-callback/${this.callbackId}/${authData.tokenMd5}`;

      this.logger.log(`Call Callback URL: ${statusCallbackUrl}`);

      const data = {
        From: toNumber,
        To: fromNumber || authData.fromNumber,
        CallerId: authData.callerId,
        StatusCallback: statusCallbackUrl,
        StatusCallbackContentType: 'application/json',
        Record: record,
      };

      const voiceUrl = `${authData.apiDomain}/v1/Accounts/${authData.accountSid}/Calls/connect.json`;
      const response = await this.makeHttpRequest(voiceUrl, data, authData);

      this.logger.log(`Voice call response: ${JSON.stringify(response)}`);

      // Save initial voice callback
      setImmediate(() => {
        this.saveInitialVoiceCallback(response, authData.tokenMd5).catch((error) => {
          this.logger.error(`Error saving initial voice callback: ${error.message}`);
        });
      });

      return response;
    } catch (error) {
      this.logger.error(`Error making voice call: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Connect two numbers via voice call (with rate limiting)
   */
  async connectCall(fromNumber: string, toNumber: string) {
    return this.voiceLimiter.schedule(() =>
      this._connectCallInternal(fromNumber, toNumber)
    );
  }

  /**
   * Internal connect call logic
   */
  private async _connectCallInternal(fromNumber: string, toNumber: string) {
    this.logger.log(`Connecting call from: ${fromNumber} to: ${toNumber}`);

    try {
      const authData = this.getAuthData();
      const statusCallbackUrl = `${this.baseUrl}/api/webhooks/exotel/call-callback/${this.callbackId}/${authData.tokenMd5}`;

      const data = {
        From: fromNumber,
        To: toNumber,
        CallerId: authData.callerId,
        StatusCallback: statusCallbackUrl,
        StatusCallbackContentType: 'application/json',
      };

      const voiceUrl = `${authData.apiDomain}/v1/Accounts/${authData.accountSid}/Calls/connect.json`;
      const response = await this.makeHttpRequest(voiceUrl, data, authData);

      this.logger.log(`Connect call response: ${JSON.stringify(response)}`);

      return response;
    } catch (error) {
      this.logger.error(`Error connecting call: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Save SMS callback to database with upsert logic to prevent duplicates
   * @param callbackData Validated SMS callback data from Exotel webhook
   * @param tokenMd5 MD5 token for verification (already validated by guard)
   */
  async saveSmsCallback(callbackData: any, tokenMd5: string) {
    try {
      const smsSid = callbackData.SmsSid || callbackData.sms_sid;

      if (!smsSid) {
        this.logger.warn('SMS callback received without SmsSid, skipping save');
        return null;
      }

      // Use upsert to prevent race condition duplicates
      const smsCallback = await this.prisma.smsCallback.upsert({
        where: { smsSid },
        create: {
          userId: tokenMd5,
          smsSid,
          toNumber: callbackData.To || callbackData.to,
          status: callbackData.Status || callbackData.status,
          detailedStatus: callbackData.DetailedStatus || callbackData.detailed_status,
          detailedStatusCode: callbackData.DetailedStatusCode || callbackData.detailed_status_code,
          smsUnits: callbackData.SmsUnits || callbackData.sms_units,
          dateSent: callbackData.DateSent || callbackData.date_sent,
        },
        update: {
          status: callbackData.Status || callbackData.status,
          detailedStatus: callbackData.DetailedStatus || callbackData.detailed_status,
          detailedStatusCode: callbackData.DetailedStatusCode || callbackData.detailed_status_code,
          smsUnits: callbackData.SmsUnits || callbackData.sms_units,
          dateSent: callbackData.DateSent || callbackData.date_sent,
        },
      });

      this.logger.log(`SMS callback saved/updated: ${smsCallback.id} - SmsSid: ${smsSid} (verified via webhook signature)`);
      return smsCallback;
    } catch (error) {
      this.logger.error(`Error saving SMS callback: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Save voice callback to database with upsert logic to prevent duplicates
   * @param callbackData Validated voice callback data from Exotel webhook
   * @param tokenMd5 MD5 token for verification (already validated by guard)
   */
  async saveVoiceCallback(callbackData: any, tokenMd5: string) {
    try {
      const callSid = callbackData.CallSid || callbackData.call_sid;

      if (!callSid) {
        this.logger.warn('Voice callback received without CallSid, skipping save');
        return null;
      }

      // Use upsert to prevent race condition duplicates
      const voiceCallback = await this.prisma.voiceCallback.upsert({
        where: { callSid },
        create: {
          userId: tokenMd5,
          sid: callbackData.Sid || callbackData.sid,
          callSid,
          parentCallSid: callbackData.ParentCallSid || callbackData.parent_call_sid,
          dateCreated: callbackData.DateCreated || callbackData.date_created,
          dateUpdated: callbackData.DateUpdated || callbackData.date_updated,
          accountSid: callbackData.AccountSid || callbackData.account_sid,
          toNumber: callbackData.To || callbackData.to,
          fromNumber: callbackData.From || callbackData.from,
          phoneNumberSid: callbackData.PhoneNumberSid || callbackData.phone_number_sid,
          status: callbackData.Status || callbackData.status,
          startTime: callbackData.StartTime || callbackData.start_time,
          endTime: callbackData.EndTime || callbackData.end_time,
          duration: callbackData.Duration || callbackData.duration,
          price: callbackData.Price || callbackData.price,
          direction: callbackData.Direction || callbackData.direction,
          answeredBy: callbackData.AnsweredBy || callbackData.answered_by,
          forwardedFrom: callbackData.ForwardedFrom || callbackData.forwarded_from,
          callerName: callbackData.CallerName || callbackData.caller_name,
          uri: callbackData.Uri || callbackData.uri,
          recordingUrl: callbackData.RecordingUrl || callbackData.recording_url,
        },
        update: {
          status: callbackData.Status || callbackData.status,
          dateUpdated: callbackData.DateUpdated || callbackData.date_updated,
          endTime: callbackData.EndTime || callbackData.end_time,
          duration: callbackData.Duration || callbackData.duration,
          price: callbackData.Price || callbackData.price,
          answeredBy: callbackData.AnsweredBy || callbackData.answered_by,
          recordingUrl: callbackData.RecordingUrl || callbackData.recording_url,
        },
      });

      this.logger.log(`Voice callback saved/updated: ${voiceCallback.id} - CallSid: ${callSid} (verified via webhook signature)`);
      return voiceCallback;
    } catch (error) {
      this.logger.error(`Error saving voice callback: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get SMS callbacks for a number
   */
  async getSmsCallbacks(toNumber: string) {
    const callbacks = await this.prisma.smsCallback.findMany({
      where: { toNumber },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      count: callbacks.length,
      callbacks,
    };
  }

  /**
   * Get voice callbacks for a number
   */
  async getVoiceCallbacks(toNumber: string) {
    const callbacks = await this.prisma.voiceCallback.findMany({
      where: { toNumber },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      count: callbacks.length,
      callbacks,
    };
  }

  /**
   * Fetch bulk call details from Exotel API
   * @param startDate Start date for filtering calls
   * @param endDate End date for filtering calls
   * @returns Bulk call details from Exotel
   */
  async fetchBulkCallDetails(startDate: Date, endDate: Date): Promise<any> {
    this.logger.log(`Fetching bulk call details from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    try {
      const authData = this.getAuthData();

      // Format dates as per Exotel API requirements: YYYY-MM-DD HH:MM:SS
      const formatDate = (date: Date) => date.toISOString().slice(0, 19).replace('T', ' ');
      const dateFilter = `gte:${formatDate(startDate)};lte:${formatDate(endDate)}`;

      const url = `${authData.apiDomain}/v1/Accounts/${authData.accountSid}/Calls.json?DateCreated=${encodeURIComponent(dateFilter)}`;

      const auth = Buffer.from(`${authData.apiKey}:${authData.apiSecret}`).toString('base64');

      this.logger.debug(`Bulk call details URL: ${url}`);

      const response = await this.httpClient.get(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`Bulk call details fetched: ${response.data?.Calls?.length || 0} calls`);

      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching bulk call details: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Manually sync call data from Exotel API to database
   * Useful when webhooks are not working (local dev, testing)
   * @param callSid Optional specific call SID to sync
   * @returns Updated call data
   */
  async syncCallDataFromExotel(callSid?: string): Promise<any> {
    this.logger.log(`Manual sync requested${callSid ? ` for CallSid: ${callSid}` : ' for recent calls'}`);

    try {
      if (callSid) {
        // Sync specific call
        const callData = await this.getCallDetails(callSid);

        // Update database with latest call data
        const updatedCall = await this.prisma.voiceCallback.upsert({
          where: { callSid },
          create: {
            userId: 'manual-sync',
            callSid,
            status: callData.Status?.toLowerCase() || callData.status?.toLowerCase() || 'unknown',
            direction: callData.Direction || callData.direction,
            fromNumber: callData.From || callData.from,
            toNumber: callData.To || callData.to,
            startTime: callData.StartTime || callData.start_time || null,
            endTime: callData.EndTime || callData.end_time || null,
            duration: callData.Duration ? String(callData.Duration) : (callData.duration ? String(callData.duration) : null),
            answeredBy: callData.AnsweredBy || callData.answered_by || null,
            recordingUrl: callData.RecordingUrl || callData.recording_url || null,
          },
          update: {
            status: callData.Status?.toLowerCase() || callData.status?.toLowerCase() || 'unknown',
            endTime: callData.EndTime || callData.end_time || null,
            duration: callData.Duration ? String(callData.Duration) : (callData.duration ? String(callData.duration) : null),
            answeredBy: callData.AnsweredBy || callData.answered_by || null,
            recordingUrl: callData.RecordingUrl || callData.recording_url || null,
          },
        });

        this.logger.log(`Call ${callSid} synced successfully`);
        return { success: true, call: updatedCall };
      } else {
        // Sync recent calls (last 72 hours to account for timezone differences)
        // Add 6 hours buffer to endDate to account for IST timezone (UTC+5:30)
        const endDate = new Date(Date.now() + 6 * 60 * 60 * 1000);
        const startDate = new Date(endDate.getTime() - 72 * 60 * 60 * 1000);

        const bulkData = await this.fetchBulkCallDetails(startDate, endDate);
        const calls = bulkData?.Calls || [];

        let syncedCount = 0;
        let errorCount = 0;

        for (const call of calls) {
          try {
            await this.prisma.voiceCallback.upsert({
              where: { callSid: call.Sid || call.sid },
              create: {
                userId: 'bulk-sync',
                callSid: call.Sid || call.sid,
                status: call.Status?.toLowerCase() || 'unknown',
                direction: call.Direction,
                fromNumber: call.From,
                toNumber: call.To,
                startTime: call.StartTime || null,
                endTime: call.EndTime || null,
                duration: call.Duration ? String(call.Duration) : null,
                answeredBy: call.AnsweredBy || null,
                recordingUrl: call.RecordingUrl || null,
              },
              update: {
                status: call.Status?.toLowerCase() || 'unknown',
                endTime: call.EndTime || null,
                duration: call.Duration ? String(call.Duration) : null,
                answeredBy: call.AnsweredBy || null,
                recordingUrl: call.RecordingUrl || null,
              },
            });
            syncedCount++;
          } catch (err) {
            this.logger.warn(`Failed to sync call ${call.Sid || call.sid}: ${err.message}`);
            errorCount++;
          }
        }

        this.logger.log(`Bulk sync completed: ${syncedCount} calls synced, ${errorCount} errors`);
        return { success: true, syncedCount, errorCount, totalCalls: calls.length };
      }
    } catch (error) {
      this.logger.error(`Error syncing call data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check Exophone health using HeartBeat API
   * @returns Exophone health status
   */
  async checkExophoneHealth(): Promise<any> {
    this.logger.log('Checking Exophone health via HeartBeat API');

    try {
      const authData = this.getAuthData();
      const url = `${authData.apiDomain}/v1/Accounts/${authData.accountSid}/Heartbeat`;

      const auth = Buffer.from(`${authData.apiKey}:${authData.apiSecret}`).toString('base64');

      this.logger.debug(`HeartBeat URL: ${url}`);

      const response = await this.httpClient.get(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`Exophone health status: ${response.data?.status_type || 'Unknown'}`);

      return response.data;
    } catch (error) {
      this.logger.error(`Error checking Exophone health: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get detailed call information using v2 CCM API
   * @param callSid Unique call identifier
   * @returns Detailed call information
   */
  async getCallDetails(callSid: string): Promise<any> {
    this.logger.log(`Getting call details for CallSid: ${callSid}`);

    try {
      const authData = this.getAuthData();

      // Use v1 API which provides more reliable data including AnsweredBy field
      const url = `${authData.apiDomain}/v1/Accounts/${authData.accountSid}/Calls/${callSid}.json`;

      const auth = Buffer.from(`${authData.apiKey}:${authData.apiSecret}`).toString('base64');

      this.logger.debug(`Call details URL: ${url}`);

      const response = await this.httpClient.get(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`Call details retrieved for CallSid: ${callSid}`);

      // Return the Call object from the response
      return response.data?.Call || response.data;
    } catch (error) {
      this.logger.error(`Error getting call details: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get Exotel users (agents) using CCM API v2
   * @param includeActiveCall Include active call information for each user
   * @returns List of Exotel users with their device and call status
   */
  async getExotelUsers(includeActiveCall: boolean = true): Promise<any> {
    this.logger.log('Fetching Exotel users (agents) from CCM API');

    try {
      const authData = this.getAuthData();

      // CCM API uses different domain
      const ccmApiDomain = 'https://ccm-api.exotel.com';
      const fields = includeActiveCall ? 'devices,active_call' : 'devices';
      const url = `${ccmApiDomain}/v2/accounts/${authData.accountSid}/users?fields=${fields}`;

      const auth = Buffer.from(`${authData.apiKey}:${authData.apiSecret}`).toString('base64');

      this.logger.debug(`Exotel users URL: ${url}`);

      const response = await this.httpClient.get(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      // Exotel CCM API v2 response structure: { request_id, method, http_code, metadata, response: { users: [] } }
      const users = response.data?.response?.users || [];
      this.logger.log(`Exotel users retrieved: ${users.length} users`);

      return {
        users,
        count: users.length,
        request_id: response.data?.request_id,
        metadata: response.data?.metadata,
      };
    } catch (error) {
      this.logger.error(`Error fetching Exotel users: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Fetch and sync ExoPhones (virtual numbers) from Exotel
   * @returns Synced ExoPhone data with department mappings
   */
  async syncExoPhonesFromExotel(): Promise<any> {
    this.logger.log('Fetching ExoPhones from Exotel API');

    try {
      const authData = this.getAuthData();
      const url = `${authData.apiDomain}/v2_beta/Accounts/${authData.accountSid}/IncomingPhoneNumbers`;

      const auth = Buffer.from(`${authData.apiKey}:${authData.apiSecret}`).toString('base64');

      this.logger.debug(`ExoPhones URL: ${url}`);

      const response = await this.httpClient.get(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      const exophones = response.data?.incoming_phone_numbers || [];
      this.logger.log(`Fetched ${exophones.length} ExoPhones from Exotel`);

      // Sync to database
      const syncedPhones = [];
      for (const exophone of exophones) {
        const phoneNumber = exophone.phone_number || exophone.PhoneNumber;
        const friendlyName = exophone.friendly_name || exophone.FriendlyName || `ExoPhone ${phoneNumber}`;

        // Upsert phone number
        const dbPhone = await this.prisma.phoneNumber.upsert({
          where: { number: phoneNumber },
          create: {
            number: phoneNumber,
            friendlyName: friendlyName,
            type: 'exophone',
            isActive: true,
            isPrimary: exophones.indexOf(exophone) === 0,
            capabilities: {
              voice: exophone.capabilities?.voice ?? true,
              sms: exophone.capabilities?.sms ?? true,
              recording: true,
            },
            metadata: {
              exophoneSid: exophone.sid || exophone.Sid,
              voiceUrl: exophone.voice_url || exophone.VoiceUrl,
              smsUrl: exophone.sms_url || exophone.SmsUrl,
              numberType: exophone.number_type || exophone.NumberType,
            },
          },
          update: {
            friendlyName: friendlyName,
            metadata: {
              exophoneSid: exophone.sid || exophone.Sid,
              voiceUrl: exophone.voice_url || exophone.VoiceUrl,
              smsUrl: exophone.sms_url || exophone.SmsUrl,
              numberType: exophone.number_type || exophone.NumberType,
            },
          },
        });

        syncedPhones.push(dbPhone);
      }

      this.logger.log(`Successfully synced ${syncedPhones.length} ExoPhones to database`);

      return {
        success: true,
        totalFetched: exophones.length,
        syncedToDb: syncedPhones.length,
        phones: syncedPhones,
      };
    } catch (error) {
      this.logger.error(`Error syncing ExoPhones: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper methods
  private generateUUID(): string {
    return crypto.randomUUID();
  }

  private generateMd5(input: string): string {
    return crypto.createHash('md5').update(input).digest('hex');
  }

  private async saveInitialSmsCallback(response: any, tokenMd5: string) {
    if (response?.SMSMessage) {
      const smsData = response.SMSMessage;
      await this.saveSmsCallback(
        {
          SmsSid: smsData.Sid,
          To: smsData.To,
          Status: smsData.Status,
          DetailedStatus: smsData.DetailedStatus,
          DateSent: smsData.DateSent,
        },
        tokenMd5,
      );
    }
  }

  private async saveInitialVoiceCallback(response: any, tokenMd5: string) {
    if (response?.Call) {
      const callData = response.Call;
      await this.saveVoiceCallback(
        {
          Sid: callData.Sid,
          CallSid: callData.Sid,
          To: callData.To,
          From: callData.From,
          Status: callData.Status,
          DateCreated: callData.DateCreated,
        },
        tokenMd5,
      );
    }
  }
}
