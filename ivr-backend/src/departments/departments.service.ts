import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

/**
 * Departments Service
 * Handles department management operations
 */
@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new department
   */
  async create(createDepartmentDto: CreateDepartmentDto) {
    this.logger.log(`Creating department: ${createDepartmentDto.name}`);

    // Check if department with same name already exists
    const existing = await this.prisma.department.findUnique({
      where: { name: createDepartmentDto.name },
    });

    if (existing) {
      throw new ConflictException(`Department with name "${createDepartmentDto.name}" already exists`);
    }

    const department = await this.prisma.department.create({
      data: createDepartmentDto,
      include: {
        manager: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
        agents: {
          select: {
            id: true,
            agentName: true,
            email: true,
            status: true,
          },
        },
      },
    });

    this.logger.log(`Department created successfully: ${department.name} (ID: ${department.id})`);
    return department;
  }

  /**
   * Get all departments
   */
  async findAll(includeInactive = false) {
    this.logger.log(`Fetching all departments (includeInactive: ${includeInactive})`);

    const where = includeInactive ? {} : { isActive: true };

    const departments = await this.prisma.department.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
        agents: {
          select: {
            id: true,
            agentName: true,
            email: true,
            status: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return departments;
  }

  /**
   * Get department by ID
   */
  async findOne(id: number) {
    this.logger.log(`Fetching department with ID: ${id}`);

    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
        agents: {
          select: {
            id: true,
            agentName: true,
            agentNumber: true,
            email: true,
            status: true,
            skills: true,
            maxConcurrentCalls: true,
            priority: true,
            createdAt: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  /**
   * Get dropdown list (simplified)
   */
  async getDropdownList() {
    this.logger.log('Fetching department dropdown list');

    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return departments;
  }

  /**
   * Update department
   */
  async update(id: number, updateDepartmentDto: UpdateDepartmentDto) {
    this.logger.log(`Updating department with ID: ${id}`);

    // Check if department exists
    const existing = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    // If name is being updated, check for conflicts
    if (updateDepartmentDto.name && updateDepartmentDto.name !== existing.name) {
      const nameConflict = await this.prisma.department.findUnique({
        where: { name: updateDepartmentDto.name },
      });

      if (nameConflict) {
        throw new ConflictException(`Department with name "${updateDepartmentDto.name}" already exists`);
      }
    }

    const updated = await this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
      include: {
        manager: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
        agents: {
          select: {
            id: true,
            agentName: true,
            email: true,
            status: true,
          },
        },
      },
    });

    this.logger.log(`Department updated successfully: ${updated.name} (ID: ${updated.id})`);
    return updated;
  }

  /**
   * Delete department (soft delete by setting isActive = false)
   */
  async remove(id: number) {
    this.logger.log(`Deleting department with ID: ${id}`);

    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        agents: true,
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    // Check if department has agents
    if (department.agents.length > 0) {
      throw new ConflictException(
        `Cannot delete department "${department.name}" because it has ${department.agents.length} assigned agent(s). Please reassign or remove agents first.`,
      );
    }

    // Soft delete
    await this.prisma.department.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`Department soft-deleted: ${department.name} (ID: ${id})`);
    return { message: `Department "${department.name}" has been deactivated successfully` };
  }

  /**
   * Get department statistics
   */
  async getStatistics(id: number) {
    this.logger.log(`Fetching statistics for department ID: ${id}`);

    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        agents: {
          include: {
            queueAssignments: {
              select: {
                waitTimeSeconds: true,
                exitReason: true,
              },
            },
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    const totalAgents = department.agents.length;
    const activeAgents = department.agents.filter((a) => a.status === 'online' || a.status === 'on_call').length;
    const busyAgents = department.agents.filter((a) => a.status === 'busy' || a.status === 'on_call').length;

    // Calculate total calls handled by department agents
    let totalCalls = 0;
    let totalWaitTime = 0;
    let completedCalls = 0;

    department.agents.forEach((agent) => {
      const calls = agent.queueAssignments;
      totalCalls += calls.length;
      completedCalls += calls.filter((c) => c.exitReason === 'connected').length;
      totalWaitTime += calls.reduce((sum, c) => sum + (c.waitTimeSeconds || 0), 0);
    });

    const avgWaitTime = totalCalls > 0 ? Math.round(totalWaitTime / totalCalls) : 0;

    return {
      departmentId: department.id,
      departmentName: department.name,
      totalAgents,
      activeAgents,
      busyAgents,
      offlineAgents: totalAgents - activeAgents,
      totalCalls,
      completedCalls,
      avgWaitTimeSeconds: avgWaitTime,
    };
  }
}
