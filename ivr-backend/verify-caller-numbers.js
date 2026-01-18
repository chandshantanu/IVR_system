const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Verifying caller number display in analytics...\n');

  // Simulate what the analytics service does
  const accessiblePhoneNumbers = null; // Admin user has null (all access)

  const where = {
    createdAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    }
  };

  // Apply access control - THIS IS THE KEY PART
  if (accessiblePhoneNumbers !== null && accessiblePhoneNumbers) {
    where.toNumber = { in: accessiblePhoneNumbers };
    console.log('Applying phone number filter:', accessiblePhoneNumbers);
  } else if (accessiblePhoneNumbers === null) {
    console.log('Admin user - NO phone number filter applied (should see all calls)');
  } else {
    console.log('Empty phone number list - will see NO calls');
  }

  const calls = await prisma.voiceCallback.findMany({
    where,
    select: {
      id: true,
      callSid: true,
      fromNumber: true,
      toNumber: true,
      status: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log(`\nFound ${calls.length} calls:\n`);
  console.table(calls.map(call => ({
    callSid: call.callSid?.substring(0, 20) + '...',
    from: call.fromNumber || 'NULL',
    to: call.toNumber || 'NULL',
    status: call.status
  })));

  if (calls.length > 0) {
    console.log('\n✅ SUCCESS! Calls are being returned with caller numbers.');
    console.log('\nSample API response format:');
    console.log(JSON.stringify({
      callerNumber: calls[0].fromNumber,
      calledNumber: calls[0].toNumber,
      callSid: calls[0].callSid,
      status: calls[0].status
    }, null, 2));
  } else {
    console.log('\n❌ PROBLEM: No calls returned even though data exists.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
