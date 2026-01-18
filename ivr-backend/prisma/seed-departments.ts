import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding departments...');

  // Create departments
  const departments = [
    {
      name: 'Sales',
      description: 'Sales and lead generation team',
      phoneNumber: '+911141169368',
      email: 'sales@company.com',
      isActive: true,
    },
    {
      name: 'Support',
      description: 'Customer support and service team',
      phoneNumber: '+911141169369',
      email: 'support@company.com',
      isActive: true,
    },
    {
      name: 'Technical',
      description: 'Technical support and engineering team',
      phoneNumber: '+911141169370',
      email: 'technical@company.com',
      isActive: true,
    },
    {
      name: 'Billing',
      description: 'Billing, accounts, and finance team',
      phoneNumber: '+911141169371',
      email: 'billing@company.com',
      isActive: true,
    },
    {
      name: 'General',
      description: 'General inquiries and information',
      email: 'info@company.com',
      isActive: true,
    },
  ];

  for (const dept of departments) {
    const created = await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
    console.log(`✅ Created/Updated department: ${created.name}`);
  }

  console.log('🎉 Department seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding departments:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
