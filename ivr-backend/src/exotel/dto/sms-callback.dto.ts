import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO for Exotel SMS Callback Webhook
 * Validates incoming webhook data from Exotel SMS
 */
export class SmsCallbackDto {
  @ApiProperty({ description: 'Unique SMS identifier' })
  @IsString()
  @IsOptional()
  SmsSid?: string;

  @ApiProperty({ description: 'Unique SMS identifier (lowercase)' })
  @IsString()
  @IsOptional()
  sms_sid?: string;

  @ApiProperty({ description: 'Recipient number' })
  @IsString()
  @IsOptional()
  To?: string;

  @ApiProperty({ description: 'Recipient number (lowercase)' })
  @IsString()
  @IsOptional()
  to?: string;

  @ApiProperty({ description: 'SMS status' })
  @IsString()
  @IsOptional()
  Status?: string;

  @ApiProperty({ description: 'SMS status (lowercase)' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Detailed status message' })
  @IsString()
  @IsOptional()
  DetailedStatus?: string;

  @ApiProperty({ description: 'Detailed status message (lowercase)' })
  @IsString()
  @IsOptional()
  detailed_status?: string;

  @ApiProperty({ description: 'Detailed status code' })
  @IsString()
  @IsOptional()
  DetailedStatusCode?: string;

  @ApiProperty({ description: 'Detailed status code (lowercase)' })
  @IsString()
  @IsOptional()
  detailed_status_code?: string;

  @ApiProperty({ description: 'Number of SMS units used' })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : null))
  @IsNumber()
  SmsUnits?: number;

  @ApiProperty({ description: 'Number of SMS units used (lowercase)' })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : null))
  @IsNumber()
  sms_units?: number;

  @ApiProperty({ description: 'Date sent' })
  @IsString()
  @IsOptional()
  DateSent?: string;

  @ApiProperty({ description: 'Date sent (lowercase)' })
  @IsString()
  @IsOptional()
  date_sent?: string;
}
