import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFlowDto, UpdateFlowDto, PublishFlowDto } from './dto/create-flow.dto';

/**
 * FlowsService - Manages IVR flow CRUD operations
 *
 * Note: This service is now primarily for viewing flows created on Exotel's website.
 * Flow execution happens on Exotel's platform, not here.
 *
 * Flows can still be created here for reference/templates, but won't be executed locally.
 */
@Injectable()
export class FlowsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new IVR flow (for reference/templates)
   * Note: Actual flow execution happens on Exotel's platform
   */
  async create(createFlowDto: CreateFlowDto, userId: number) {
    // Note: Removed NodeFactory validation since flows are for reference only

    // Create flow with nodes and connections in a transaction
    const flow = await this.prisma.$transaction(async (tx) => {
      // Create flow
      const createdFlow = await tx.ivrFlow.create({
        data: {
          name: createFlowDto.name,
          description: createFlowDto.description,
          flowType: createFlowDto.flowType,
          status: 'draft',
          version: 1,
          isPublished: false,
          configuration: createFlowDto.configuration || {},
          createdById: userId
        }
      });

      // Create nodes
      const createdNodes = [];
      for (const nodeDto of createFlowDto.nodes) {
        const node = await tx.flowNode.create({
          data: {
            flowId: createdFlow.id,
            nodeType: nodeDto.nodeType,
            name: nodeDto.name,
            positionX: nodeDto.positionX || 0,
            positionY: nodeDto.positionY || 0,
            configuration: nodeDto.configuration
          }
        });
        createdNodes.push(node);
      }

      // Set entry node if specified
      if (createFlowDto.entryNodeIndex !== undefined) {
        const entryNode = createdNodes[createFlowDto.entryNodeIndex];
        if (!entryNode) {
          throw new BadRequestException('Invalid entry node index');
        }

        await tx.ivrFlow.update({
          where: { id: createdFlow.id },
          data: { entryNodeId: entryNode.id }
        });
      }

      // Create connections
      if (createFlowDto.connections) {
        for (const connDto of createFlowDto.connections) {
          const sourceNode = createdNodes[connDto.sourceNodeIndex];
          const targetNode = createdNodes[connDto.targetNodeIndex];

          if (!sourceNode || !targetNode) {
            throw new BadRequestException('Invalid connection node indices');
          }

          await tx.flowConnection.create({
            data: {
              flowId: createdFlow.id,
              sourceNodeId: sourceNode.id,
              targetNodeId: targetNode.id,
              condition: connDto.condition,
              conditionValue: connDto.conditionValue,
              label: connDto.label
            }
          });
        }
      }

      return createdFlow;
    });

    // Return flow with relations
    return this.findOne(flow.id);
  }

  /**
   * Find all flows with optional filters
   */
  async findAll(filters?: { status?: string; flowType?: string }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.flowType) {
      where.flowType = filters.flowType;
    }

    return this.prisma.ivrFlow.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        _count: {
          select: {
            nodes: true,
            connections: true,
            executions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Find one flow by ID
   */
  async findOne(id: number) {
    const flow = await this.prisma.ivrFlow.findUnique({
      where: { id },
      include: {
        nodes: {
          orderBy: { createdAt: 'asc' }
        },
        connections: {
          orderBy: { createdAt: 'asc' }
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      }
    });

    if (!flow) {
      throw new NotFoundException(`Flow ${id} not found`);
    }

    return flow;
  }

  /**
   * Update a flow
   */
  async update(id: number, updateFlowDto: UpdateFlowDto) {
    const flow = await this.findOne(id);

    if (flow.status === 'published') {
      throw new BadRequestException('Cannot update published flow. Create a new version instead.');
    }

    // Note: Removed NodeFactory validation since flows are for reference only
    // Flows execute on Exotel's platform, not here

    // Update flow in transaction
    await this.prisma.$transaction(async (tx) => {
      // Update basic flow properties
      await tx.ivrFlow.update({
        where: { id },
        data: {
          name: updateFlowDto.name,
          description: updateFlowDto.description,
          status: updateFlowDto.status
        }
      });

      // Update nodes if provided
      if (updateFlowDto.nodes) {
        // Delete existing nodes and connections
        await tx.flowConnection.deleteMany({ where: { flowId: id } });
        await tx.flowNode.deleteMany({ where: { flowId: id } });

        // Create new nodes
        const createdNodes = [];
        for (const nodeDto of updateFlowDto.nodes) {
          const node = await tx.flowNode.create({
            data: {
              flowId: id,
              nodeType: nodeDto.nodeType,
              name: nodeDto.name,
              positionX: nodeDto.positionX || 0,
              positionY: nodeDto.positionY || 0,
              configuration: nodeDto.configuration
            }
          });
          createdNodes.push(node);
        }

        // Update entry node if specified
        if (updateFlowDto.entryNodeIndex !== undefined) {
          const entryNode = createdNodes[updateFlowDto.entryNodeIndex];
          if (entryNode) {
            await tx.ivrFlow.update({
              where: { id },
              data: { entryNodeId: entryNode.id }
            });
          }
        }

        // Create new connections
        if (updateFlowDto.connections) {
          for (const connDto of updateFlowDto.connections) {
            const sourceNode = createdNodes[connDto.sourceNodeIndex];
            const targetNode = createdNodes[connDto.targetNodeIndex];

            if (sourceNode && targetNode) {
              await tx.flowConnection.create({
                data: {
                  flowId: id,
                  sourceNodeId: sourceNode.id,
                  targetNodeId: targetNode.id,
                  condition: connDto.condition,
                  conditionValue: connDto.conditionValue,
                  label: connDto.label
                }
              });
            }
          }
        }
      }
    });

    return this.findOne(id);
  }

  /**
   * Publish a flow (make it available for execution)
   */
  async publish(id: number, publishDto?: PublishFlowDto) {
    const flow = await this.findOne(id);

    // Validate flow has entry node
    if (!flow.entryNodeId) {
      throw new BadRequestException('Flow must have an entry node before publishing');
    }

    // Validate all nodes are connected
    // TODO: Add graph connectivity validation

    // Publish the flow
    await this.prisma.ivrFlow.update({
      where: { id },
      data: {
        status: 'published',
        isPublished: true,
        publishedAt: new Date()
      }
    });

    return this.findOne(id);
  }

  /**
   * Delete a flow
   */
  async remove(id: number) {
    const flow = await this.findOne(id);

    if (flow.status === 'published') {
      throw new BadRequestException('Cannot delete published flow. Unpublish it first.');
    }

    await this.prisma.ivrFlow.delete({
      where: { id }
    });

    return { message: 'Flow deleted successfully' };
  }

  /**
   * Get flow execution statistics
   */
  async getFlowStats(id: number) {
    const flow = await this.findOne(id);

    const [totalExecutions, completedExecutions, failedExecutions, avgDuration] = await Promise.all([
      this.prisma.flowExecution.count({
        where: { flowId: id }
      }),
      this.prisma.flowExecution.count({
        where: { flowId: id, status: 'completed' }
      }),
      this.prisma.flowExecution.count({
        where: { flowId: id, status: 'failed' }
      }),
      this.prisma.flowExecution.aggregate({
        where: { flowId: id, status: 'completed' },
        _avg: { durationSeconds: true }
      })
    ]);

    return {
      flowId: id,
      flowName: flow.name,
      totalExecutions,
      completedExecutions,
      failedExecutions,
      successRate: totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0,
      averageDuration: avgDuration._avg.durationSeconds || 0
    };
  }
}
