import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, IsObject } from 'class-validator';

/**
 * DTO for creating a flow node
 */
export class CreateFlowNodeDto {
  @ApiProperty({ description: 'Node type' })
  @IsString()
  nodeType: string;

  @ApiProperty({ description: 'Node name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Node configuration', type: 'object' })
  @IsObject()
  configuration: any;

  @ApiProperty({ description: 'X position on canvas', required: false })
  @IsOptional()
  @IsNumber()
  positionX?: number;

  @ApiProperty({ description: 'Y position on canvas', required: false })
  @IsOptional()
  @IsNumber()
  positionY?: number;
}

/**
 * DTO for creating a flow connection
 */
export class CreateFlowConnectionDto {
  @ApiProperty({ description: 'Source node index in nodes array' })
  @IsNumber()
  sourceNodeIndex: number;

  @ApiProperty({ description: 'Target node index in nodes array' })
  @IsNumber()
  targetNodeIndex: number;

  @ApiProperty({ description: 'Connection condition', required: false })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiProperty({ description: 'Condition value', required: false })
  @IsOptional()
  @IsString()
  conditionValue?: string;

  @ApiProperty({ description: 'Connection label', required: false })
  @IsOptional()
  @IsString()
  label?: string;
}

/**
 * DTO for creating a new IVR flow
 */
export class CreateFlowDto {
  @ApiProperty({ description: 'Flow name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Flow description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Flow type (inbound, outbound, survey, etc.)' })
  @IsString()
  flowType: string;

  @ApiProperty({ description: 'Entry node index', required: false })
  @IsOptional()
  @IsNumber()
  entryNodeIndex?: number;

  @ApiProperty({ description: 'Flow nodes', type: [CreateFlowNodeDto] })
  @IsArray()
  nodes: CreateFlowNodeDto[];

  @ApiProperty({ description: 'Flow connections', type: [CreateFlowConnectionDto], required: false })
  @IsOptional()
  @IsArray()
  connections?: CreateFlowConnectionDto[];

  @ApiProperty({ description: 'Additional configuration', required: false })
  @IsOptional()
  @IsObject()
  configuration?: any;
}

/**
 * DTO for updating a flow
 */
export class UpdateFlowDto {
  @ApiProperty({ description: 'Flow name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Flow description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Flow status', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Flow nodes', required: false })
  @IsOptional()
  @IsArray()
  nodes?: CreateFlowNodeDto[];

  @ApiProperty({ description: 'Flow connections', required: false })
  @IsOptional()
  @IsArray()
  connections?: CreateFlowConnectionDto[];

  @ApiProperty({ description: 'Entry node index', required: false })
  @IsOptional()
  @IsNumber()
  entryNodeIndex?: number;
}

/**
 * DTO for publishing a flow
 */
export class PublishFlowDto {
  @ApiProperty({ description: 'Create new version', default: false })
  @IsOptional()
  @IsBoolean()
  createNewVersion?: boolean;
}
