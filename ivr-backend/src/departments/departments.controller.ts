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
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Departments Controller
 * REST API for department management
 */
@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  /**
   * Create a new department
   */
  @Post()
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ status: 201, description: 'Department created successfully' })
  @ApiResponse({ status: 409, description: 'Department with this name already exists' })
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  /**
   * Get all departments
   */
  @Get()
  @ApiOperation({ summary: 'Get all departments' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of departments' })
  async findAll(@Query('includeInactive') includeInactive?: string) {
    const includeInactiveBool = includeInactive === 'true';
    return this.departmentsService.findAll(includeInactiveBool);
  }

  /**
   * Get department dropdown list (simplified)
   */
  @Get('dropdown')
  @ApiOperation({ summary: 'Get simplified department list for dropdowns' })
  @ApiResponse({ status: 200, description: 'List of departments with id and name only' })
  async getDropdownList() {
    return this.departmentsService.getDropdownList();
  }

  /**
   * Get department by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Department details' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.findOne(id);
  }

  /**
   * Get department statistics
   */
  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get department performance statistics' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Department statistics' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async getStatistics(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.getStatistics(id);
  }

  /**
   * Update department
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update department' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Department updated successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @ApiResponse({ status: 409, description: 'Department name already exists' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  /**
   * Delete department (soft delete)
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete department (soft delete - sets isActive=false)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Department deleted successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @ApiResponse({ status: 409, description: 'Department has assigned agents and cannot be deleted' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.remove(id);
  }
}
