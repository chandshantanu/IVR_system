import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, IsEmail } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Sales', description: 'Department name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Sales and lead generation team', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1, description: 'Manager user ID', required: false })
  @IsOptional()
  @IsInt()
  managerId?: number;

  @ApiProperty({ example: '+911141169368', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: 'sales@company.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: true, default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
