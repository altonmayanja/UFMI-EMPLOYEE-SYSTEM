/* eslint-disable @typescript-eslint/no-require-imports */
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function seed() {
  const prisma = new PrismaClient();
  const seedPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!seedPassword) {
    throw new Error('ADMIN_SEED_PASSWORD must be configured to seed the platform administrator');
  }

  try {
    const passwordHash = await bcrypt.hash(seedPassword, 12);
    await prisma.user.upsert({
      where: { username: 'admin@niltd.com' },
      update: { passwordHash, role: 'super_admin', status: 'active', organizationId: null },
      create: {
        username: 'admin@niltd.com',
        passwordHash,
        role: 'super_admin',
        status: 'active',
      },
    });
    console.log('Platform administrator seed completed.');
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error) => {
  console.error('Platform administrator seed failed:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});
