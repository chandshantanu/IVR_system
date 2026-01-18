import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FlowsService } from './flows.service';
import { CreateFlowDto, UpdateFlowDto, PublishFlowDto } from './dto/create-flow.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Flows Controller - REST API for IVR flow management
 */
@ApiTags('IVR Flows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/ivr/flows')
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  /**
   * Create a new IVR flow
   */
  @Post()
  @ApiOperation({ summary: 'Create a new IVR flow' })
  @ApiResponse({ status: 201, description: 'Flow created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid flow configuration' })
  async create(
    @Body() createFlowDto: CreateFlowDto,
    @Request() req
  ) {
    return this.flowsService.create(createFlowDto, req.user.userId);
  }

  /**
   * Get all IVR flows
   */
  @Get()
  @ApiOperation({ summary: 'Get all IVR flows' })
  @ApiResponse({ status: 200, description: 'List of flows' })
  async findAll(
    @Query('status') status?: string,
    @Query('flowType') flowType?: string
  ) {
    return this.flowsService.findAll({ status, flowType });
  }

  /**
   * Get a specific IVR flow by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get IVR flow by ID' })
  @ApiResponse({ status: 200, description: 'Flow details' })
  @ApiResponse({ status: 404, description: 'Flow not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.flowsService.findOne(id);
  }

  /**
   * Update an IVR flow
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update an IVR flow' })
  @ApiResponse({ status: 200, description: 'Flow updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid flow configuration' })
  @ApiResponse({ status: 404, description: 'Flow not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFlowDto: UpdateFlowDto
  ) {
    return this.flowsService.update(id, updateFlowDto);
  }

  /**
   * Publish an IVR flow
   */
  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish an IVR flow' })
  @ApiResponse({ status: 200, description: 'Flow published successfully' })
  @ApiResponse({ status: 400, description: 'Flow validation failed' })
  async publish(
    @Param('id', ParseIntPipe) id: number,
    @Body() publishDto?: PublishFlowDto
  ) {
    return this.flowsService.publish(id, publishDto);
  }

  /**
   * Delete an IVR flow
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an IVR flow' })
  @ApiResponse({ status: 200, description: 'Flow deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete published flow' })
  @ApiResponse({ status: 404, description: 'Flow not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.flowsService.remove(id);
  }

  /**
   * Get flow execution statistics
   */
  @Get(':id/stats')
  @ApiOperation({ summary: 'Get flow execution statistics' })
  @ApiResponse({ status: 200, description: 'Flow statistics' })
  async getStats(@Param('id', ParseIntPipe) id: number) {
    return this.flowsService.getFlowStats(id);
  }
}
