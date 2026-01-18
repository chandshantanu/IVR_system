import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed production-ready IVR flows based on the flow diagram
 */
async function seedProductionFlows() {
  console.log('Seeding production IVR flows...');

  // Find admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: 'super_admin' }
  });

  if (!adminUser) {
    console.error('No admin user found. Please run main seed first.');
    return;
  }

  // Create queues first
  const techSupportQueue = await prisma.queue.create({
    data: {
      name: 'Technical Support Queue',
      description: 'Queue for technical support calls',
      maxSize: 50,
      maxWaitTimeSeconds: 600,
      musicOnHoldUrl: 'https://example.com/hold-music-tech.mp3',
      announcementIntervalSeconds: 30,
      strategy: 'skills_based',
      overflowAction: 'voicemail',
      overflowTarget: 'tech_voicemail'
    }
  });

  const generalQueue = await prisma.queue.create({
    data: {
      name: 'General Inquiries Queue',
      description: 'Queue for general inquiries',
      maxSize: 30,
      maxWaitTimeSeconds: 300,
      musicOnHoldUrl: 'https://example.com/hold-music-general.mp3',
      announcementIntervalSeconds: 30,
      strategy: 'round_robin'
    }
  });

  // Create agents
  const billingAgent = await prisma.agent.create({
    data: {
      agentNumber: '+919876543210',
      agentName: 'Billing Agent',
      email: 'billing@example.com',
      department: 'Billing',
      skills: { skills: ['billing', 'refunds', 'payments'] },
      status: 'available',
      maxConcurrentCalls: 2,
      priority: 1
    }
  });

  const techAgent1 = await prisma.agent.create({
    data: {
      agentNumber: '+919876543211',
      agentName: 'Tech Support Agent 1',
      email: 'tech1@example.com',
      department: 'Technical Support',
      skills: { skills: ['technical', 'troubleshooting', 'advanced'] },
      status: 'available',
      maxConcurrentCalls: 3,
      priority: 1
    }
  });

  const techAgent2 = await prisma.agent.create({
    data: {
      agentNumber: '+919876543212',
      agentName: 'Tech Support Agent 2',
      email: 'tech2@example.com',
      department: 'Technical Support',
      skills: { skills: ['technical', 'troubleshooting'] },
      status: 'available',
      maxConcurrentCalls: 2,
      priority: 2
    }
  });

  const generalAgent = await prisma.agent.create({
    data: {
      agentNumber: '+919876543213',
      agentName: 'General Support Agent',
      email: 'general@example.com',
      department: 'Customer Service',
      skills: { skills: ['general', 'customer_service'] },
      status: 'available',
      maxConcurrentCalls: 2,
      priority: 1
    }
  });

  console.log(`✓ Created 2 queues and 4 agents`);

  // Main Customer Support Flow (Based on Diagram)
  const mainFlow = await prisma.ivrFlow.create({
    data: {
      name: 'Main Customer Support Flow',
      description: 'Primary IVR flow for all incoming customer calls',
      flowType: 'inbound',
      status: 'published',
      version: 1,
      isPublished: true,
      createdById: adminUser.id,
      publishedAt: new Date()
    }
  });

  // Node 1: Welcome with Business Hours Check
  const welcomeNode = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'welcome',
      name: 'Welcome & Business Hours',
      positionX: 100,
      positionY: 100,
      configuration: {
        message: 'Welcome to ABC Company Customer Support. We are here to help you.',
        language: 'en-IN',
        voiceGender: 'female',
        checkBusinessHours: true,
        businessHoursMessage: 'We are currently closed. Our business hours are Monday to Friday, 9 AM to 6 PM. Please call back during business hours or leave a voicemail after the beep.'
      }
    }
  });

  // Node 2: Business Hours Decision
  const businessHoursDecision = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'decision',
      name: 'Business Hours Check',
      positionX: 250,
      positionY: 100,
      configuration: {
        decisionType: 'time_based',
        businessHoursCheck: true,
        conditions: [
          {
            variableName: 'business_hours',
            operator: 'equals',
            value: true,
            targetNodeId: -1  // Will update with main menu ID
          },
          {
            variableName: 'business_hours',
            operator: 'equals',
            value: false,
            targetNodeId: -1  // Will update with closed voicemail ID
          }
        ]
      }
    }
  });

  // Node 3: Main Menu
  const mainMenu = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'menu',
      name: 'Main Menu',
      positionX: 400,
      positionY: 100,
      configuration: {
        prompt: 'Press 1 for billing and payment inquiries. Press 2 for technical support. Press 3 for general inquiries. Press 9 to speak with an agent. Press 0 to repeat this menu.',
        language: 'en-IN',
        voiceGender: 'female',
        timeout: 15,
        numDigits: 1,
        maxRetries: 3,
        invalidMessage: 'Invalid option. Please try again.',
        timeoutMessage: 'We did not receive your input.',
        options: [
          { digit: '1', label: 'Billing' },
          { digit: '2', label: 'Technical Support' },
          { digit: '3', label: 'General Inquiries' },
          { digit: '9', label: 'Agent' },
          { digit: '0', label: 'Repeat Menu' }
        ]
      }
    }
  });

  // Branch 1: Billing Path
  const billingMessage = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'play',
      name: 'Billing Info Message',
      positionX: 550,
      positionY: 50,
      configuration: {
        message: 'For billing inquiries, you can also visit our website at www dot abc company dot com slash billing. Connecting you to a billing specialist now.',
        language: 'en-IN',
        voiceGender: 'female'
      }
    }
  });

  const billingTransfer = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'transfer',
      name: 'Transfer to Billing',
      positionX: 700,
      positionY: 50,
      configuration: {
        transferType: 'agent',
        agents: [
          {
            agentId: billingAgent.id,
            agentNumber: billingAgent.agentNumber,
            agentName: billingAgent.agentName,
            skills: ['billing']
          }
        ],
        routingStrategy: 'sequential',
        requiredSkills: ['billing'],
        maxRingTime: 30,
        recordCall: true,
        whisperMessage: 'Billing inquiry call',
        language: 'en-IN'
      }
    }
  });

  // Branch 2: Technical Support Path
  const techMessage = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'play',
      name: 'Tech Support Message',
      positionX: 550,
      positionY: 150,
      configuration: {
        message: 'Our technical support team will assist you shortly. Please stay on the line.',
        language: 'en-IN',
        voiceGender: 'female'
      }
    }
  });

  const techQueue = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'queue',
      name: 'Tech Support Queue',
      positionX: 700,
      positionY: 150,
      configuration: {
        queueId: techSupportQueue.id,
        queueName: 'Technical Support Queue',
        maxWaitTime: 600,
        maxQueueSize: 50,
        musicOnHoldUrl: 'https://example.com/hold-music-tech.mp3',
        announcementInterval: 30,
        positionAnnouncementMessage: 'You are number {position} in the queue. Estimated wait time is approximately {waitTime} seconds. Thank you for your patience.',
        callbackOption: true,
        callbackMessage: 'Press star if you would like us to call you back instead of waiting.',
        language: 'en-IN'
      }
    }
  });

  const techTransfer = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'transfer',
      name: 'Transfer to Tech Support',
      positionX: 850,
      positionY: 150,
      configuration: {
        transferType: 'agent',
        agents: [
          {
            agentId: techAgent1.id,
            agentNumber: techAgent1.agentNumber,
            agentName: techAgent1.agentName,
            skills: ['technical', 'advanced']
          },
          {
            agentId: techAgent2.id,
            agentNumber: techAgent2.agentNumber,
            agentName: techAgent2.agentName,
            skills: ['technical']
          }
        ],
        routingStrategy: 'skills_based',
        requiredSkills: ['technical'],
        maxRingTime: 30,
        recordCall: true,
        language: 'en-IN'
      }
    }
  });

  // Branch 3: General Inquiries Path
  const generalMessage = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'play',
      name: 'General Info Message',
      positionX: 550,
      positionY: 250,
      configuration: {
        message: 'For general inquiries, you can also email us at support at abc company dot com. Connecting you to an agent.',
        language: 'en-IN',
        voiceGender: 'female'
      }
    }
  });

  const generalQueue = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'queue',
      name: 'General Queue',
      positionX: 700,
      positionY: 250,
      configuration: {
        queueId: generalQueue.id,
        queueName: 'General Inquiries Queue',
        maxWaitTime: 300,
        maxQueueSize: 30,
        announcementInterval: 30,
        callbackOption: true,
        language: 'en-IN'
      }
    }
  });

  const generalTransfer = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'transfer',
      name: 'Transfer to General Agent',
      positionX: 850,
      positionY: 250,
      configuration: {
        transferType: 'agent',
        agents: [
          {
            agentId: generalAgent.id,
            agentNumber: generalAgent.agentNumber,
            agentName: generalAgent.agentName
          }
        ],
        routingStrategy: 'sequential',
        maxRingTime: 30,
        recordCall: true,
        language: 'en-IN'
      }
    }
  });

  // Branch 4: Direct Agent Transfer
  const agentTransferMessage = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'play',
      name: 'Agent Transfer Message',
      positionX: 550,
      positionY: 350,
      configuration: {
        message: 'Please hold while we connect you to an available agent.',
        language: 'en-IN',
        voiceGender: 'female'
      }
    }
  });

  const directAgentTransfer = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'transfer',
      name: 'Direct Agent Transfer',
      positionX: 700,
      positionY: 350,
      configuration: {
        transferType: 'agent',
        agents: [
          { agentId: billingAgent.id, agentNumber: billingAgent.agentNumber, agentName: billingAgent.agentName },
          { agentId: techAgent1.id, agentNumber: techAgent1.agentNumber, agentName: techAgent1.agentName },
          { agentId: techAgent2.id, agentNumber: techAgent2.agentNumber, agentName: techAgent2.agentName },
          { agentId: generalAgent.id, agentNumber: generalAgent.agentNumber, agentName: generalAgent.agentName }
        ],
        routingStrategy: 'longest_idle',
        maxRingTime: 30,
        recordCall: true,
        language: 'en-IN'
      }
    }
  });

  // Closed Hours - Voicemail
  const closedVoicemail = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'record',
      name: 'After Hours Voicemail',
      positionX: 250,
      positionY: 250,
      configuration: {
        recordingType: 'voicemail',
        prompt: 'We are currently closed. Please leave a detailed message including your name and phone number, and we will return your call during business hours.',
        maxLength: 180,
        timeout: 5,
        finishOnKey: '#',
        beepSound: true,
        saveToVariable: 'voicemail_url',
        emailRecording: true,
        emailTo: 'voicemail@example.com',
        language: 'en-IN'
      }
    }
  });

  // Thank You & Hangup Nodes
  const thankYouAfterTransfer = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'hangup',
      name: 'Thank You & Goodbye',
      positionX: 1000,
      positionY: 200,
      configuration: {
        message: 'Thank you for contacting ABC Company. Have a great day!',
        reason: 'call_completed',
        language: 'en-IN',
        voiceGender: 'female'
      }
    }
  });

  const thankYouAfterVoicemail = await prisma.flowNode.create({
    data: {
      flowId: mainFlow.id,
      nodeType: 'hangup',
      name: 'Thank You for Voicemail',
      positionX: 400,
      positionY: 250,
      configuration: {
        message: 'Thank you for your message. We will get back to you soon. Goodbye.',
        reason: 'voicemail_left',
        language: 'en-IN',
        voiceGender: 'female'
      }
    }
  });

  // Create connections
  await prisma.flowConnection.createMany({
    data: [
      // Welcome -> Business Hours Decision
      {
        flowId: mainFlow.id,
        sourceNodeId: welcomeNode.id,
        targetNodeId: businessHoursDecision.id,
        condition: 'default',
        label: 'Check Hours'
      },
      // Business Hours Decision -> Main Menu (if open)
      {
        flowId: mainFlow.id,
        sourceNodeId: businessHoursDecision.id,
        targetNodeId: mainMenu.id,
        condition: 'dtmf',
        conditionValue: 'open',
        label: 'Business Hours: Open'
      },
      // Business Hours Decision -> Voicemail (if closed)
      {
        flowId: mainFlow.id,
        sourceNodeId: businessHoursDecision.id,
        targetNodeId: closedVoicemail.id,
        condition: 'dtmf',
        conditionValue: 'closed',
        label: 'Business Hours: Closed'
      },
      // Main Menu -> Billing (Option 1)
      {
        flowId: mainFlow.id,
        sourceNodeId: mainMenu.id,
        targetNodeId: billingMessage.id,
        condition: 'dtmf',
        conditionValue: '1',
        label: 'Billing (1)'
      },
      // Billing Message -> Billing Transfer
      {
        flowId: mainFlow.id,
        sourceNodeId: billingMessage.id,
        targetNodeId: billingTransfer.id,
        condition: 'default'
      },
      // Billing Transfer -> Thank You
      {
        flowId: mainFlow.id,
        sourceNodeId: billingTransfer.id,
        targetNodeId: thankYouAfterTransfer.id,
        condition: 'default'
      },
      // Main Menu -> Tech Support (Option 2)
      {
        flowId: mainFlow.id,
        sourceNodeId: mainMenu.id,
        targetNodeId: techMessage.id,
        condition: 'dtmf',
        conditionValue: '2',
        label: 'Tech Support (2)'
      },
      // Tech Message -> Tech Queue
      {
        flowId: mainFlow.id,
        sourceNodeId: techMessage.id,
        targetNodeId: techQueue.id,
        condition: 'default'
      },
      // Tech Queue -> Tech Transfer
      {
        flowId: mainFlow.id,
        sourceNodeId: techQueue.id,
        targetNodeId: techTransfer.id,
        condition: 'default'
      },
      // Tech Transfer -> Thank You
      {
        flowId: mainFlow.id,
        sourceNodeId: techTransfer.id,
        targetNodeId: thankYouAfterTransfer.id,
        condition: 'default'
      },
      // Main Menu -> General (Option 3)
      {
        flowId: mainFlow.id,
        sourceNodeId: mainMenu.id,
        targetNodeId: generalMessage.id,
        condition: 'dtmf',
        conditionValue: '3',
        label: 'General (3)'
      },
      // General Message -> General Queue
      {
        flowId: mainFlow.id,
        sourceNodeId: generalMessage.id,
        targetNodeId: generalQueue.id,
        condition: 'default'
      },
      // General Queue -> General Transfer
      {
        flowId: mainFlow.id,
        sourceNodeId: generalQueue.id,
        targetNodeId: generalTransfer.id,
        condition: 'default'
      },
      // General Transfer -> Thank You
      {
        flowId: mainFlow.id,
        sourceNodeId: generalTransfer.id,
        targetNodeId: thankYouAfterTransfer.id,
        condition: 'default'
      },
      // Main Menu -> Agent (Option 9)
      {
        flowId: mainFlow.id,
        sourceNodeId: mainMenu.id,
        targetNodeId: agentTransferMessage.id,
        condition: 'dtmf',
        conditionValue: '9',
        label: 'Agent (9)'
      },
      // Agent Message -> Direct Transfer
      {
        flowId: mainFlow.id,
        sourceNodeId: agentTransferMessage.id,
        targetNodeId: directAgentTransfer.id,
        condition: 'default'
      },
      // Direct Transfer -> Thank You
      {
        flowId: mainFlow.id,
        sourceNodeId: directAgentTransfer.id,
        targetNodeId: thankYouAfterTransfer.id,
        condition: 'default'
      },
      // Main Menu -> Repeat (Option 0)
      {
        flowId: mainFlow.id,
        sourceNodeId: mainMenu.id,
        targetNodeId: mainMenu.id,
        condition: 'dtmf',
        conditionValue: '0',
        label: 'Repeat Menu (0)'
      },
      // Voicemail -> Thank You
      {
        flowId: mainFlow.id,
        sourceNodeId: closedVoicemail.id,
        targetNodeId: thankYouAfterVoicemail.id,
        condition: 'default'
      }
    ]
  });

  // Set entry node
  await prisma.ivrFlow.update({
    where: { id: mainFlow.id },
    data: { entryNodeId: welcomeNode.id }
  });

  console.log(`✓ Created Main Customer Support Flow (ID: ${mainFlow.id})`);
  console.log(`  - ${await prisma.flowNode.count({ where: { flowId: mainFlow.id } })} nodes`);
  console.log(`  - ${await prisma.flowConnection.count({ where: { flowId: mainFlow.id } })} connections`);

  console.log('\n✅ Production flow seeding completed!');
}

seedProductionFlows()
  .catch((e) => {
    console.error('Error seeding production flows:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
