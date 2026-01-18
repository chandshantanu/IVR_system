import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class MakeCallDto {
  @ApiProperty({
    example: '+919876543210',
    description: 'Phone number to call',
  })
  @IsString()
  @IsNotEmpty()
  toNumber: string;

  @ApiProperty({
    example: '+919876543211',
    description: 'Source number (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  fromNumber?: string;

  @ApiProperty({
    example: 'true',
    description: 'Whether to record the call',
    default: 'true',
    required: false,
  })
  @IsString()
  @IsOptional()
  record?: string;
}
