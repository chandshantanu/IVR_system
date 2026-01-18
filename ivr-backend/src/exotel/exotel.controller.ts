import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ExotelService } from './exotel.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { MakeCallDto } from './dto/make-call.dto';
import { ConnectCallDto } from './dto/connect-call.dto';
import { VoiceCallbackDto } from './dto/voice-callback.dto';
import { SmsCallbackDto } from './dto/sms-callback.dto';
import { WebhookSignatureGuard } from './guards/webhook-signature.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('exotel')
@Controller('api')
export class ExotelController {
  constructor(private readonly exotelService: ExotelService) {}

  // ========== SMS Endpoints ==========

  @Post('exotel/send-sms')
  @ApiOperation({ summary: 'Send SMS to a user' })
  @ApiResponse({ status: 200, description: 'SMS sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async sendSms(@Body() sendSmsDto: SendSmsDto) {
    const response = await this.exotelService.sendSms(
      sendSmsDto.toNumber,
      sendSmsDto.message,
      sendSmsDto.dltTemplateId,
      sendSmsDto.dltEntityId,
    );
    return { message: 'SMS sent successfully', data: response };
  }

  @Get('exotel/sms-callbacks')
  @ApiOperation({ summary: 'Get SMS callbacks for a number' })
  @ApiQuery({ name: 'toNumber', required: true, description: 'Phone number' })
  @ApiResponse({ status: 200, description: 'SMS callbacks retrieved' })
  async getSmsCallbacks(@Query('toNumber') toNumber: string) {
    return this.exotelService.getSmsCallbacks(toNumber);
  }

  // ========== Voice Call Endpoints ==========

  @Post('exotel/make-call')
  @ApiOperation({ summary: 'Make a voice call to a user' })
  @ApiResponse({ status: 200, description: 'Call initiated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async makeCall(@Body() makeCallDto: MakeCallDto) {
    const response = await this.exotelService.makeCall(
      makeCallDto.toNumber,
      makeCallDto.fromNumber,
      makeCallDto.record,
    );
    return { message: 'Call initiated successfully', data: response };
  }

  @Post('exotel/connect-call')
  @ApiOperation({ summary: 'Connect two numbers via voice call' })
  @ApiResponse({ status: 200, description: 'Call connected successfully' })
  async connectCall(@Body() connectCallDto: ConnectCallDto) {
    const response = await this.exotelService.connectCall(
      connectCallDto.fromNumber,
      connectCallDto.toNumber,
    );
    return { message: 'Call connected successfully', data: response };
  }

  @Get('exotel/voice-callbacks')
  @ApiOperation({ summary: 'Get voice call callbacks for a number' })
  @ApiQuery({ name: 'toNumber', required: true, description: 'Phone number' })
  @ApiResponse({ status: 200, description: 'Voice callbacks retrieved' })
  async getVoiceCallbacks(@Query('toNumber') toNumber: string) {
    return this.exotelService.getVoiceCallbacks(toNumber);
  }

  @Post('exotel/sync-calls')
  @ApiOperation({
    summary: 'Manually sync call data from Exotel API',
    description: 'Useful when webhooks are not working (local dev, testing). Fetches latest call data from Exotel and updates database.'
  })
  @ApiQuery({ name: 'callSid', required: false, description: 'Specific Call SID to sync (optional, syncs last 24h if not provided)' })
  @ApiResponse({ status: 200, description: 'Calls synced successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async syncCallsFromExotel(@Query('callSid') callSid?: string) {
    const result = await this.exotelService.syncCallDataFromExotel(callSid);
    return {
      message: callSid ? 'Call synced successfully' : 'Bulk sync completed',
      ...result
    };
  }

  // ========== Agent/User Endpoints ==========

  @Get('exotel/users')
  @ApiOperation({ summary: 'Get Exotel users (agents) with device and call status' })
  @ApiQuery({ name: 'includeActiveCall', required: false, description: 'Include active call information (default: true)', type: Boolean })
  @ApiResponse({ status: 200, description: 'Exotel users retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getExotelUsers(@Query('includeActiveCall') includeActiveCall?: string) {
    const includeCall = includeActiveCall === 'false' ? false : true;
    const result = await this.exotelService.getExotelUsers(includeCall);
    return {
      message: 'Exotel users retrieved successfully',
      ...result
    };
  }

  @Post('exotel/sync-exophones')
  @ApiOperation({
    summary: 'Sync ExoPhones (virtual numbers) from Exotel',
    description: 'Fetches all virtual numbers from Exotel API with their friendly names and configurations'
  })
  @ApiResponse({ status: 200, description: 'ExoPhones synced successfully' })
  async syncExoPhones() {
    const result = await this.exotelService.syncExoPhonesFromExotel();
    return {
      message: 'ExoPhones synced successfully',
      ...result
    };
  }

  // ========== Webhook Endpoints (Public - No Auth) ==========

  @Public()
  @UseGuards(WebhookSignatureGuard)
  @Post('webhooks/exotel/sms-callback/:callbackId/:tokenMd5')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exotel SMS status callback webhook - Secured with signature verification' })
  @ApiParam({ name: 'callbackId', description: 'Callback ID' })
  @ApiParam({ name: 'tokenMd5', description: 'MD5 token for verification' })
  @ApiResponse({ status: 200, description: 'Callback processed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid webhook signature' })
  async handleSmsCallback(
    @Param('callbackId') callbackId: string,
    @Param('tokenMd5') tokenMd5: string,
    @Body() callbackData: SmsCallbackDto,
  ) {
    await this.exotelService.saveSmsCallback(callbackData, tokenMd5);

    return {
      message: 'SMS callback received and processed successfully',
      callback_id: callbackId,
      sms_sid: callbackData.SmsSid || callbackData.sms_sid,
      status: callbackData.Status || callbackData.status,
    };
  }

  @Public()
  @UseGuards(WebhookSignatureGuard)
  @Post('webhooks/exotel/call-callback/:callbackId/:tokenMd5')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exotel voice call status callback webhook - Secured with signature verification' })
  @ApiParam({ name: 'callbackId', description: 'Callback ID' })
  @ApiParam({ name: 'tokenMd5', description: 'MD5 token for verification' })
  @ApiResponse({ status: 200, description: 'Callback processed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid webhook signature' })
  async handleCallCallback(
    @Param('callbackId') callbackId: string,
    @Param('tokenMd5') tokenMd5: string,
    @Body() callbackData: VoiceCallbackDto,
  ) {
    await this.exotelService.saveVoiceCallback(callbackData, tokenMd5);

    return {
      message: 'Voice callback received and processed successfully',
      callback_id: callbackId,
      call_sid: callbackData.CallSid || callbackData.call_sid,
      status: callbackData.Status || callbackData.status,
    };
  }
}
