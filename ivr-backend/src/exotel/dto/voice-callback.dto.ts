import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO for Exotel Voice Callback Webhook
 * Validates incoming webhook data from Exotel voice calls
 */
export class VoiceCallbackDto {
  @ApiProperty({ description: 'Unique call identifier' })
  @IsString()
  @IsOptional()
  CallSid?: string;

  @ApiProperty({ description: 'Unique call identifier (lowercase)' })
  @IsString()
  @IsOptional()
  call_sid?: string;

  @ApiProperty({ description: 'Unique SID' })
  @IsString()
  @IsOptional()
  Sid?: string;

  @ApiProperty({ description: 'Unique SID (lowercase)' })
  @IsString()
  @IsOptional()
  sid?: string;

  @ApiProperty({ description: 'Parent call SID' })
  @IsString()
  @IsOptional()
  ParentCallSid?: string;

  @ApiProperty({ description: 'Parent call SID (lowercase)' })
  @IsString()
  @IsOptional()
  parent_call_sid?: string;

  @ApiProperty({ description: 'Date created' })
  @IsString()
  @IsOptional()
  DateCreated?: string;

  @ApiProperty({ description: 'Date created (lowercase)' })
  @IsString()
  @IsOptional()
  date_created?: string;

  @ApiProperty({ description: 'Date updated' })
  @IsString()
  @IsOptional()
  DateUpdated?: string;

  @ApiProperty({ description: 'Date updated (lowercase)' })
  @IsString()
  @IsOptional()
  date_updated?: string;

  @ApiProperty({ description: 'Account SID' })
  @IsString()
  @IsOptional()
  AccountSid?: string;

  @ApiProperty({ description: 'Account SID (lowercase)' })
  @IsString()
  @IsOptional()
  account_sid?: string;

  @ApiProperty({ description: 'Called number' })
  @IsString()
  @IsOptional()
  To?: string;

  @ApiProperty({ description: 'Called number (lowercase)' })
  @IsString()
  @IsOptional()
  to?: string;

  @ApiProperty({ description: 'Caller number' })
  @IsString()
  @IsOptional()
  From?: string;

  @ApiProperty({ description: 'Caller number (lowercase)' })
  @IsString()
  @IsOptional()
  from?: string;

  @ApiProperty({ description: 'Phone number SID' })
  @IsString()
  @IsOptional()
  PhoneNumberSid?: string;

  @ApiProperty({ description: 'Phone number SID (lowercase)' })
  @IsString()
  @IsOptional()
  phone_number_sid?: string;

  @ApiProperty({ description: 'Call status' })
  @IsString()
  @IsOptional()
  Status?: string;

  @ApiProperty({ description: 'Call status (lowercase)' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Call start time' })
  @IsString()
  @IsOptional()
  StartTime?: string;

  @ApiProperty({ description: 'Call start time (lowercase)' })
  @IsString()
  @IsOptional()
  start_time?: string;

  @ApiProperty({ description: 'Call end time' })
  @IsString()
  @IsOptional()
  EndTime?: string;

  @ApiProperty({ description: 'Call end time (lowercase)' })
  @IsString()
  @IsOptional()
  end_time?: string;

  @ApiProperty({ description: 'Call duration in seconds' })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : null))
  @IsNumber()
  Duration?: number;

  @ApiProperty({ description: 'Call duration in seconds (lowercase)' })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : null))
  @IsNumber()
  duration?: number;

  @ApiProperty({ description: 'Call price' })
  @IsString()
  @IsOptional()
  Price?: string;

  @ApiProperty({ description: 'Call price (lowercase)' })
  @IsString()
  @IsOptional()
  price?: string;

  @ApiProperty({ description: 'Call direction (inbound/outbound)' })
  @IsString()
  @IsOptional()
  Direction?: string;

  @ApiProperty({ description: 'Call direction (lowercase)' })
  @IsString()
  @IsOptional()
  direction?: string;

  @ApiProperty({ description: 'Answered by (human/machine)' })
  @IsString()
  @IsOptional()
  AnsweredBy?: string;

  @ApiProperty({ description: 'Answered by (lowercase)' })
  @IsString()
  @IsOptional()
  answered_by?: string;

  @ApiProperty({ description: 'Forwarded from number' })
  @IsString()
  @IsOptional()
  ForwardedFrom?: string;

  @ApiProperty({ description: 'Forwarded from number (lowercase)' })
  @IsString()
  @IsOptional()
  forwarded_from?: string;

  @ApiProperty({ description: 'Caller name' })
  @IsString()
  @IsOptional()
  CallerName?: string;

  @ApiProperty({ description: 'Caller name (lowercase)' })
  @IsString()
  @IsOptional()
  caller_name?: string;

  @ApiProperty({ description: 'URI' })
  @IsString()
  @IsOptional()
  Uri?: string;

  @ApiProperty({ description: 'URI (lowercase)' })
  @IsString()
  @IsOptional()
  uri?: string;

  @ApiProperty({ description: 'Recording URL' })
  @IsString()
  @IsOptional()
  RecordingUrl?: string;

  @ApiProperty({ description: 'Recording URL (lowercase)' })
  @IsString()
  @IsOptional()
  recording_url?: string;
}
