const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Creating phone number records from existing calls...\n');

  // Get unique phone numbers from voice_callbacks
  const calls = await prisma.voiceCallback.findMany({
    select: {
      toNumber: true,
      fromNumber: true
    }
  });

  const uniqueToNumbers = [...new Set(calls.map(c => c.toNumber).filter(Boolean))];
  const uniqueFromNumbers = [...new Set(calls.map(c => c.fromNumber).filter(Boolean))];

  console.log('Found unique TO numbers (called numbers):', uniqueToNumbers);
  console.log('Found unique FROM numbers (caller numbers):', uniqueFromNumbers);

  // Create PhoneNumber records for TO numbers (these are your Exotel numbers)
  for (const number of uniqueToNumbers) {
    try {
      const phoneNumber = await prisma.phoneNumber.upsert({
        where: { number },
        create: {
          number,
          friendlyName: `Exotel Number ${number}`,
          type: 'exophone',
          isActive: true,
          isPrimary: uniqueToNumbers.indexOf(number) === 0, // First one is primary
          capabilities: {
            voice: true,
            sms: true,
            recording: true
          }
        },
        update: {}
      });
      console.log(`✓ Created/verified phone number: ${phoneNumber.number}`);
    } catch (error) {
      console.error(`✗ Error creating ${number}:`, error.message);
    }
  }

  // Get admin user
  const adminUser = await prisma.user.findFirst({
    where: {
      OR: [
        { role: 'super_admin' },
        { role: 'admin' }
      ]
    }
  });

  if (adminUser) {
    console.log(`\n✓ Admin user found: ${adminUser.username} (ID: ${adminUser.id})`);
    console.log('Note: Admin users have access to ALL phone numbers automatically.');
  } else {
    console.log('\n⚠️  No admin user found. Creating assignments for regular users would be needed.');
  }

  console.log('\n✅ Phone numbers setup complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
