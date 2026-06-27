// Database initialization and Prisma client setup

import { PrismaClient, Prisma } from '@prisma/client';
import Logger from '@shared/utils/logger';

const logger = new Logger('Database');

const prisma = new PrismaClient({
  errorFormat: 'pretty',
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received, disconnecting Prisma...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, disconnecting Prisma...');
  await prisma.$disconnect();
  process.exit(0);
});

/**
 * Initialize database - run migrations and seed if needed
 */
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Initializing database...');
    
    // Verify connection
    await prisma.$executeRawUnsafe('SELECT 1');
    logger.info('Database connection established');

    // Check if database is seeded
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      logger.info('Database is empty, seeding with default data...');
      await seedDatabase();
    }

    logger.info('Database initialization completed successfully');
  } catch (error) {
    logger.error('Failed to initialize database', error as Error);
    throw error;
  }
}

/**
 * Seed database with default data
 */
export async function seedDatabase(): Promise<void> {
  try {
    logger.info('Starting database seeding...');

    // Create default admin user
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@parking.local',
        password: '$2a$10$SQv88.BXjEyVZOEGH1OLz.YKJg7jPo4lbPVWPWzz7Qv2Qkb6mqhPa', // password: Admin@123
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    logger.info('Created default admin user', { userId: adminUser.id });

    // Create default parking lot
    const parkingLot = await prisma.parkingLot.create({
      data: {
        name: 'Main Parking Lot',
        totalSlots: 100,
        description: 'Main parking facility',
        address: '123 Main Street',
        phone: '+91-9999999999',
        email: 'parking@facility.local',
        status: 'ACTIVE',
      },
    });
    logger.info('Created default parking lot', { lotId: parkingLot.id });

    // Create parking slots (10 slots per zone, 3 zones)
    const zones = ['A', 'B', 'C'];
    const slotTypes = ['STANDARD', 'COMPACT', 'HANDICAP', 'RESERVED', 'PREMIUM'];
    let slotCounter = 1;

    for (const zone of zones) {
      for (let i = 1; i <= 10; i++) {
        const slotType = slotTypes[i % slotTypes.length];
        await prisma.parkingSlot.create({
          data: {
            slotNumber: `${zone}-${String(i).padStart(3, '0')}`,
            floor: Math.ceil(i / 10),
            zone,
            slotType: slotType as any,
            status: 'AVAILABLE',
            coordinates: JSON.stringify({ x: i * 10, y: parseInt(zone.charCodeAt(0).toString()) * 10 }),
            parkingLotId: parkingLot.id,
          },
        });
        slotCounter++;
      }
    }
    logger.info('Created parking slots', { count: slotCounter - 1 });

    // Create default pricing rules
    const pricingRules = [
      {
        name: 'Standard Rate',
        slotType: 'STANDARD',
        baseRate: 50,
        maxDailyRate: 500,
        minimumDuration: 30,
        weekendMultiplier: 1.2,
        holidayMultiplier: 1.5,
        description: 'Standard hourly rate',
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        name: 'Compact Rate',
        slotType: 'COMPACT',
        baseRate: 40,
        maxDailyRate: 400,
        minimumDuration: 30,
        weekendMultiplier: 1.1,
        holidayMultiplier: 1.4,
        description: 'Compact slot rate',
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        name: 'Premium Rate',
        slotType: 'PREMIUM',
        baseRate: 100,
        maxDailyRate: 800,
        minimumDuration: 60,
        weekendMultiplier: 1.3,
        holidayMultiplier: 1.6,
        description: 'Premium slot rate',
        effectiveFrom: new Date('2024-01-01'),
      },
    ];

    for (const rule of pricingRules) {
      await prisma.pricingRule.create({
        data: {
          ...rule,
          status: 'ACTIVE',
          parkingLotId: parkingLot.id,
        } as any,
      });
    }
    logger.info('Created pricing rules', { count: pricingRules.length });

    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Failed to seed database', error as Error);
    throw error;
  }
}

/**
 * Disconnect database
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

export default prisma;
