const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking phone number assignments...\n');

  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true
    }
  });

  console.log('Users in system:');
  console.table(users);

  // Get all phone numbers
  const phoneNumbers = await prisma.phoneNumber.findMany({
    select: {
      id: true,
      number: true,
      friendlyName: true,
      isActive: true
    }
  });

  console.log('\nPhone numbers in system:');
  console.table(phoneNumbers);

  // Get all assignments
  const assignments = await prisma.userPhoneNumberAssignment.findMany({
    include: {
      user: {
        select: {
          username: true
        }
      },
      phoneNumber: {
        select: {
          number: true,
          friendlyName: true
        }
      }
    }
  });

  console.log('\nPhone number assignments:');
  console.table(assignments.map(a => ({
    userId: a.userId,
    username: a.user.username,
    phoneNumber: a.phoneNumber.number,
    friendlyName: a.phoneNumber.friendlyName || 'N/A',
    canViewCalls: a.canViewCalls
  })));

  if (assignments.length === 0) {
    console.log('\n⚠️  NO PHONE NUMBER ASSIGNMENTS FOUND!');
    console.log('This is why no call data is being returned.');
    console.log('\nTo fix: Assign phone numbers to users or make sure users have admin role.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
