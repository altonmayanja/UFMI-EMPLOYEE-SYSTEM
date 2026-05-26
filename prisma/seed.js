/* eslint-disable @typescript-eslint/no-require-imports */
const dotenv = require('dotenv');
const path = require('path');

// Load .env file
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Now import Prisma after env vars are set
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function seed() {
  const prisma = new PrismaClient();

  try {
    console.log('Seeding database...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists, skipping creation.');
    } else {
      const passwordHash = await bcrypt.hash('admin123', 12);
      const admin = await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash,
          role: 'admin',
          status: 'active',
        }
      });
      console.log('Admin user created:', admin.username);
    }

    // Check for sample employees
    const employeeCount = await prisma.user.count({
      where: { role: 'employee' }
    });

    if (employeeCount > 0) {
      console.log(`${employeeCount} employee(s) already exist, skipping.`);
    } else {
      const employees = [
        { username: 'john', password: 'emp123', position: 'Field Officer', department: 'Operations', empId: 'EMP-001' },
        { username: 'sarah', password: 'emp123', position: 'Program Manager', department: 'Programs', empId: 'EMP-002' },
        { username: 'david', password: 'emp123', position: 'Finance Officer', department: 'Finance', empId: 'EMP-003' },
        { username: 'grace', password: 'emp123', position: 'Monitoring & Evaluation Officer', department: 'M&E', empId: 'EMP-004' },
        { username: 'peter', password: 'emp123', position: 'IT Officer', department: 'IT', empId: 'EMP-005' },
      ];

      for (const emp of employees) {
        const passwordHash = await bcrypt.hash(emp.password, 12);
        const user = await prisma.user.create({
          data: {
            username: emp.username,
            passwordHash,
            role: 'employee',
            status: 'active',
            profile: {
              create: {
                employeeId: emp.empId,
                position: emp.position,
                department: emp.department,
              }
            }
          }
        });
        console.log(`Employee created: ${emp.username} (${emp.position})`);
      }
    }

    console.log('\nSeeding complete!');
    console.log('Credentials:');
    console.log('  Admin: admin / admin123');
    console.log('  Employees: john, sarah, david, grace, peter / emp123');

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
