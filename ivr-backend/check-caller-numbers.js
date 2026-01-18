const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking caller numbers in database...\n');

  const calls = await prisma.voiceCallback.findMany({
    select: {
      callSid: true,
      fromNumber: true,
      toNumber: true,
      status: true,
      direction: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log('Recent 10 calls:');
  console.table(calls.map(call => ({
    callSid: call.callSid?.substring(0, 20) + '...',
    from: call.fromNumber || 'NULL',
    to: call.toNumber || 'NULL',
    direction: call.direction,
    status: call.status
  })));

  const total = await prisma.voiceCallback.count();
  const withFromNumber = await prisma.voiceCallback.count({
    where: {
      fromNumber: { not: null }
    }
  });

  console.log('\nStatistics:');
  console.log(`Total calls: ${total}`);
  console.log(`Calls with fromNumber: ${withFromNumber}`);
  console.log(`Calls without fromNumber: ${total - withFromNumber}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
