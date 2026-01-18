import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ConnectCallDto {
  @ApiProperty({
    example: '+919876543210',
    description: 'From phone number',
  })
  @IsString()
  @IsNotEmpty()
  fromNumber: string;

  @ApiProperty({
    example: '+919876543211',
    description: 'To phone number',
  })
  @IsString()
  @IsNotEmpty()
  toNumber: string;
}
