import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed sample IVR flows for testing and demonstration
 */
async function seedFlows() {
  console.log('Seeding sample IVR flows...');

  // Find the admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: 'super_admin' }
  });

  if (!adminUser) {
    console.error('No admin user found. Please run main seed first.');
    return;
  }

  // Sample Flow 1: Simple Customer Support IVR
  const customerSupportFlow = await prisma.ivrFlow.create({
    data: {
      name: 'Customer Support Main Menu',
      description: 'Main IVR flow for customer support inquiries',
      flowType: 'inbound',
      status: 'published',
      version: 1,
      isPublished: true,
      createdById: adminUser.id,
      publishedAt: new Date()
    }
  });

  // Create nodes for customer support flow
  const welcomeNode = await prisma.flowNode.create({
    data: {
      flowId: customerSupportFlow.id,
      nodeType: 'welcome',
      name: 'Welcome Message',
      positionX: 100,
      positionY: 100,
      configuration: {
        message: 'Welcome to ABC Company customer support. Your call is important to us.',
        language: 'en-IN',
        voiceGender: 'female',
        checkBusinessHours: true,
        businessHoursMessage: 'We are currently closed. Our business hours are Monday to Friday, 9 AM to 6 PM.'
      }
    }
  });

  const mainMenuNode = await prisma.flowNode.create({
    data: {
      flowId: customerSupportFlow.id,
      nodeType: 'menu',
      name: 'Main Menu',
      positionX: 300,
      positionY: 100,
      configuration: {
        prompt: 'Press 1 for billing inquiries. Press 2 for technical support. Press 3 for general inquiries. Press 9 to speak with an agent.',
        language: 'en-IN',
        voiceGender: 'female',
        timeout: 10,
        numDigits: 1,
        maxRetries: 3,
        invalidMessage: 'Invalid option. Please try again.',
        timeoutMessage: 'We did not receive your input. Please try again.',
        options: [
          { digit: '1', label: 'Billing' },
          { digit: '2', label: 'Technical Support' },
          { digit: '3', label: 'General Inquiries' },
          { digit: '9', label: 'Speak with Agent' }
        ]
      }
    }
  });

  const billingMessageNode = await prisma.flowNode.create({
    data: {
      flowId: customerSupportFlow.id,
      nodeType: 'play',
      name: 'Billing Information',
      positionX: 500,
      positionY: 50,
      configuration: {
        message: 'For billing inquiries, please visit our website at www.abccompany.com slash billing, or press star to return to the main menu.',
        language: 'en-IN',
        voiceGender: 'female'
      }
    }
  });

  const techSupportMessageNode = await prisma.flowNode.create({
    data: {
      flowId: customerSupportFlow.id,
      nodeType: 'play',
      name: 'Tech Support Information',
      positionX: 500,
      positionY: 150,
      configuration: {
        message: 'Our technical support team will be with you shortly. Please stay on the line.',
        language: 'en-IN',
        voiceGender: 'female'
      }
    }
  });

  const generalInfoNode = await prisma.flowNode.create({
    data: {
      flowId: customerSupportFlow.id,
      nodeType: 'play',
      name: 'General Information',
      positionX: 500,
      positionY: 250,
      configuration: {
        message: 'For general inquiries, you can email us at support at abc company dot com, or press star to return to the main menu.',
        language: 'en-IN',
        voiceGender: 'female'
      }
    }
  });

  const transferToAgentNode = await prisma.flowNode.create({
    data: {
      flowId: customerSupportFlow.id,
      nodeType: 'play',
      name: 'Transferring to Agent',
      positionX: 500,
      positionY: 350,
      configuration: {
        message: 'Please hold while we connect you to an available agent.',
        language: 'en-IN',
        voiceGender: 'female'
      }
    }
  });

  const goodbyeNode = await prisma.flowNode.create({
    data: {
      flowId: customerSupportFlow.id,
      nodeType: 'hangup',
      name: 'Goodbye',
      positionX: 700,
      positionY: 200,
      configuration: {
        message: 'Thank you for calling ABC Company. Have a great day!',
        reason: 'normal',
        language: 'en-IN',
        voiceGender: 'female'
      }
    }
  });

  // Create connections
  await prisma.flowConnection.createMany({
    data: [
      // Welcome -> Main Menu
      {
        flowId: customerSupportFlow.id,
        sourceNodeId: welcomeNode.id,
        targetNodeId: mainMenuNode.id,
        condition: 'default',
        label: 'After Welcome'
      },
      // Main Menu -> Options
      {
        flowId: customerSupportFlow.id,
        sourceNodeId: mainMenuNode.id,
        targetNodeId: billingMessageNode.id,
        condition: 'dtmf',
        conditionValue: '1',
        label: 'Billing (1)'
      },
      {
        flowId: customerSupportFlow.id,
        sourceNodeId: mainMenuNode.id,
        targetNodeId: techSupportMessageNode.id,
        condition: 'dtmf',
        conditionValue: '2',
        label: 'Tech Support (2)'
      },
      {
        flowId: customerSupportFlow.id,
        sourceNodeId: mainMenuNode.id,
        targetNodeId: generalInfoNode.id,
        condition: 'dtmf',
        conditionValue: '3',
        label: 'General (3)'
      },
      {
        flowId: customerSupportFlow.id,
        sourceNodeId: mainMenuNode.id,
        targetNodeId: transferToAgentNode.id,
        condition: 'dtmf',
        conditionValue: '9',
        label: 'Agent (9)'
      },
      // All paths -> Goodbye
      {
        flowId: customerSupportFlow.id,
        sourceNodeId: billingMessageNode.id,
        targetNodeId: goodbyeNode.id,
        condition: 'default',
        label: 'End Call'
      },
      {
        flowId: customerSupportFlow.id,
        sourceNodeId: techSupportMessageNode.id,
        targetNodeId: goodbyeNode.id,
        condition: 'default',
        label: 'End Call'
      },
      {
        flowId: customerSupportFlow.id,
        sourceNodeId: generalInfoNode.id,
        targetNodeId: goodbyeNode.id,
        condition: 'default',
        label: 'End Call'
      },
      {
        flowId: customerSupportFlow.id,
        sourceNodeId: transferToAgentNode.id,
        targetNodeId: goodbyeNode.id,
        condition: 'default',
        label: 'End Call'
      }
    ]
  });

  // Set entry node
  await prisma.ivrFlow.update({
    where: { id: customerSupportFlow.id },
    data: { entryNodeId: welcomeNode.id }
  });

  console.log(`✓ Created Customer Support flow (ID: ${customerSupportFlow.id})`);

  // Sample Flow 2: Simple Survey Flow
  const surveyFlow = await prisma.ivrFlow.create({
    data: {
      name: 'Customer Satisfaction Survey',
      description: 'Post-call satisfaction survey',
      flowType: 'survey',
      status: 'draft',
      version: 1,
      isPublished: false,
      createdById: adminUser.id
    }
  });

  const surveyWelcome = await prisma.flowNode.create({
    data: {
      flowId: surveyFlow.id,
      nodeType: 'welcome',
      name: 'Survey Welcome',
      positionX: 100,
      positionY: 100,
      configuration: {
        message: 'Thank you for your time. We would like to get your feedback.',
        language: 'en-IN',
        voiceGender: 'female'
      }
    }
  });

  const ratingMenu = await prisma.flowNode.create({
    data: {
      flowId: surveyFlow.id,
      nodeType: 'menu',
      name: 'Rate Experience',
      positionX: 300,
      positionY: 100,
      configuration: {
        prompt: 'On a scale of 1 to 5, how satisfied are you with our service? Press 1 for very dissatisfied, and 5 for very satisfied.',
        language: 'en-IN',
        voiceGender: 'female',
        timeout: 10,
        numDigits: 1,
        maxRetries: 2,
        options: [
          { digit: '1', label: 'Very Dissatisfied' },
          { digit: '2', label: 'Dissatisfied' },
          { digit: '3', label: 'Neutral' },
          { digit: '4', label: 'Satisfied' },
          { digit: '5', label: 'Very Satisfied' }
        ]
      }
    }
  });

  const thankYouNode = await prisma.flowNode.create({
    data: {
      flowId: surveyFlow.id,
      nodeType: 'hangup',
      name: 'Thank You',
      positionX: 500,
      positionY: 100,
      configuration: {
        message: 'Thank you for your feedback. Goodbye!',
        reason: 'survey_completed',
        language: 'en-IN',
        voiceGender: 'female'
      }
    }
  });

  await prisma.flowConnection.createMany({
    data: [
      {
        flowId: surveyFlow.id,
        sourceNodeId: surveyWelcome.id,
        targetNodeId: ratingMenu.id,
        condition: 'default'
      },
      {
        flowId: surveyFlow.id,
        sourceNodeId: ratingMenu.id,
        targetNodeId: thankYouNode.id,
        condition: 'default'
      }
    ]
  });

  await prisma.ivrFlow.update({
    where: { id: surveyFlow.id },
    data: { entryNodeId: surveyWelcome.id }
  });

  console.log(`✓ Created Survey flow (ID: ${surveyFlow.id})`);

  console.log('\n✅ Flow seeding completed!');
  console.log(`   - ${customerSupportFlow.name} (Published)`);
  console.log(`   - ${surveyFlow.name} (Draft)`);
}

seedFlows()
  .catch((e) => {
    console.error('Error seeding flows:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
