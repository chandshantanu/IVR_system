import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean up existing data (for development only)
  await prisma.auditLog.deleteMany({});
  await prisma.callQueueEntry.deleteMany({});
  await prisma.nodeExecution.deleteMany({});
  await prisma.flowExecution.deleteMany({});
  await prisma.flowConnection.deleteMany({});
  await prisma.flowNode.deleteMany({});
  await prisma.ivrFlow.deleteMany({});
  await prisma.agent.deleteMany({});
  await prisma.queue.deleteMany({});
  await prisma.businessHours.deleteMany({});
  await prisma.voiceCallback.deleteMany({});
  await prisma.smsCallback.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✅ Cleaned up existing data');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const agentPassword = await bcrypt.hash('agent123', 10);

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@ivr-system.com',
      passwordHash: adminPassword,
      fullName: 'System Administrator',
      role: 'super_admin',
      isActive: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      username: 'manager',
      email: 'manager@ivr-system.com',
      passwordHash: managerPassword,
      fullName: 'Call Center Manager',
      role: 'manager',
      isActive: true,
    },
  });

  const agentUser = await prisma.user.create({
    data: {
      username: 'agent',
      email: 'agent@ivr-system.com',
      passwordHash: agentPassword,
      fullName: 'Support Agent',
      role: 'agent',
      isActive: true,
    },
  });

  console.log('✅ Created users (admin, manager, agent)');

  // Create business hours
  const businessHours = await prisma.businessHours.create({
    data: {
      name: 'Standard Business Hours',
      timezone: 'Asia/Kolkata',
      schedule: {
        monday: [{ start: '09:00', end: '18:00' }],
        tuesday: [{ start: '09:00', end: '18:00' }],
        wednesday: [{ start: '09:00', end: '18:00' }],
        thursday: [{ start: '09:00', end: '18:00' }],
        friday: [{ start: '09:00', end: '18:00' }],
        saturday: [{ start: '10:00', end: '14:00' }],
        sunday: [],
      },
      holidays: ['2026-01-26', '2026-08-15', '2026-10-02'],
      isDefault: true,
    },
  });

  console.log('✅ Created business hours');

  // Create queues
  const salesQueue = await prisma.queue.create({
    data: {
      name: 'Sales Queue',
      description: 'Queue for sales inquiries',
      maxSize: 50,
      maxWaitTimeSeconds: 300,
      strategy: 'round_robin',
      overflowAction: 'voicemail',
    },
  });

  const supportQueue = await prisma.queue.create({
    data: {
      name: 'Support Queue',
      description: 'Queue for technical support',
      maxSize: 100,
      maxWaitTimeSeconds: 600,
      strategy: 'longest_idle',
      overflowAction: 'callback',
    },
  });

  console.log('✅ Created queues (Sales, Support)');

  // Create agents
  const agent1 = await prisma.agent.create({
    data: {
      agentNumber: '+919876543210',
      agentName: 'Rajesh Kumar',
      email: 'rajesh@company.com',
      department: 'Sales',
      skills: ['sales', 'billing'],
      status: 'online',
      maxConcurrentCalls: 2,
      priority: 1,
    },
  });

  const agent2 = await prisma.agent.create({
    data: {
      agentNumber: '+919876543211',
      agentName: 'Priya Sharma',
      email: 'priya@company.com',
      department: 'Support',
      skills: ['technical_support', 'troubleshooting'],
      status: 'online',
      maxConcurrentCalls: 3,
      priority: 2,
    },
  });

  const agent3 = await prisma.agent.create({
    data: {
      agentNumber: '+919876543212',
      agentName: 'Amit Patel',
      email: 'amit@company.com',
      department: 'Support',
      skills: ['technical_support', 'escalations'],
      status: 'offline',
      maxConcurrentCalls: 1,
      priority: 1,
    },
  });

  console.log('✅ Created agents (3 agents)');

  // Create sample IVR flow - Main Menu
  const mainFlow = await prisma.ivrFlow.create({
    data: {
      name: 'Main Customer Service Flow',
      description: 'Primary IVR flow for customer service hotline',
      flowType: 'inbound',
      status: 'active',
      version: 1,
      isPublished: true,
      publishedAt: new Date(),
      createdById: adminUser.id,
      configuration: {
        defaultLanguage: 'en',
        recordCalls: true,
      },
    },
  });

  // Create nodes for the flow
  const welcomeNode = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'welcome',
      name: 'Welcome Message',
      positionX: 100,
      positionY: 100,
      configuration: {
        message: 'Welcome to our customer service hotline.',
        language: 'en',
        ttsVoice: 'female',
      },
    },
  });

  const menuNode = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'menu',
      name: 'Main Menu',
      positionX: 300,
      positionY: 100,
      configuration: {
        message: 'Press 1 for Sales, Press 2 for Support, Press 3 for Billing',
        timeout: 10,
        retries: 3,
        invalidMessage: 'Invalid input. Please try again.',
      },
    },
  });

  const salesQueueNode = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'queue',
      name: 'Sales Queue',
      positionX: 500,
      positionY: 50,
      configuration: {
        queueId: salesQueue.id,
        musicOnHoldUrl: 'https://example.com/hold-music.mp3',
        announcePosition: true,
      },
    },
  });

  const supportQueueNode = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'queue',
      name: 'Support Queue',
      positionX: 500,
      positionY: 150,
      configuration: {
        queueId: supportQueue.id,
        musicOnHoldUrl: 'https://example.com/hold-music.mp3',
        announcePosition: true,
      },
    },
  });

  const hangupNode = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'hangup',
      name: 'End Call',
      positionX: 700,
      positionY: 100,
      configuration: {
        message: 'Thank you for calling. Goodbye!',
      },
    },
  });

  // Create connections between nodes
  await prisma.flowConnection.create({
    data: {
      flowId: mainFlow.id,
      sourceNodeId: welcomeNode.id,
      targetNodeId: menuNode.id,
      label: 'Next',
    },
  });

  await prisma.flowConnection.create({
    data: {
      flowId: mainFlow.id,
      sourceNodeId: menuNode.id,
      targetNodeId: salesQueueNode.id,
      condition: 'dtmf',
      conditionValue: '1',
      label: 'Sales (1)',
    },
  });

  await prisma.flowConnection.create({
    data: {
      flowId: mainFlow.id,
      sourceNodeId: menuNode.id,
      targetNodeId: supportQueueNode.id,
      condition: 'dtmf',
      conditionValue: '2',
      label: 'Support (2)',
    },
  });

  await prisma.flowConnection.create({
    data: {
      flowId: mainFlow.id,
      sourceNodeId: salesQueueNode.id,
      targetNodeId: hangupNode.id,
      label: 'After Queue',
    },
  });

  await prisma.flowConnection.create({
    data: {
      flowId: mainFlow.id,
      sourceNodeId: supportQueueNode.id,
      targetNodeId: hangupNode.id,
      label: 'After Queue',
    },
  });

  console.log('✅ Created sample IVR flow with nodes and connections');

  // Update flow entry node
  await prisma.ivrFlow.update({
    where: { id: mainFlow.id },
    data: { entryNodeId: welcomeNode.id },
  });

  console.log('✅ Updated flow entry node');

  // Create sample audit log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'create_flow',
      entityType: 'flow',
      entityId: mainFlow.id,
      changes: {
        name: 'Main Customer Service Flow',
        status: 'active',
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Seed Script',
    },
  });

  console.log('✅ Created audit log entry');

  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('📋 Created resources:');
  console.log('   - 3 Users (admin/admin123, manager/manager123, agent/agent123)');
  console.log('   - 1 Business Hours Configuration');
  console.log('   - 2 Queues (Sales, Support)');
  console.log('   - 3 Agents');
  console.log('   - 1 IVR Flow with 6 nodes');
  console.log('   - 1 Audit Log Entry\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
