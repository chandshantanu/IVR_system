import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class SendSmsDto {
  @ApiProperty({
    example: '+919876543210',
    description: 'Recipient phone number with country code',
  })
  @IsString()
  @IsNotEmpty()
  toNumber: string;

  @ApiProperty({
    example: 'Hello from IVR System!',
    description: 'SMS message content',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    example: 'TEMPLATE_ID_123',
    description: 'DLT Template ID for regulatory compliance',
  })
  @IsString()
  @IsNotEmpty()
  dltTemplateId: string;

  @ApiProperty({
    example: 'ENTITY_ID_456',
    description: 'DLT Entity ID for regulatory compliance',
  })
  @IsString()
  @IsNotEmpty()
  dltEntityId: string;
}
