import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO for calling back a caller from call history
 */
export class CallbackCallerDto {
  @ApiProperty({
    example: '+919876543210',
    description: 'Phone number to call back (the original caller)',
  })
  @IsString()
  @IsNotEmpty()
  callerNumber: string;

  @ApiProperty({
    example: '+919876543211',
    description: 'Agent phone number (who initiates the callback)',
    required: false,
  })
  @IsString()
  @IsOptional()
  agentNumber?: string;

  @ApiProperty({
    example: 'call_12345',
    description: 'Original call ID for tracking',
    required: false,
  })
  @IsString()
  @IsOptional()
  originalCallId?: string;
}
