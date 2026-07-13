// Database initialization and Prisma client setup

import type { Prisma } from '@prisma/client';
import Logger from '@shared/utils/logger';

const logger = new Logger('Database');

// Load @prisma/client with interoperability for CJS/Esm runtimes.
// Some environments (Electron main bundled as CJS) may produce a module
// shape where the PrismaClient constructor is nested under `default`.
// Try require-based loading first (works in CJS builds), fall back
// to checking common locations on the imported module.
function loadPrismaClient(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@prisma/client');

    // Helper to find the constructor in several possible module shapes
    const findCtor = (m: any) => {
      if (!m) return null;
      if (typeof m === 'function') return m;
      if (typeof m.PrismaClient === 'function') return m.PrismaClient;
      if (m.default) {
        if (typeof m.default === 'function') return m.default;
        if (typeof m.default.PrismaClient === 'function') return m.default.PrismaClient;
        if (m.default.default && typeof m.default.default.PrismaClient === 'function') return m.default.default.PrismaClient;
      }
      return null;
    };

    return findCtor(mod) || findCtor(mod.default) || findCtor(mod.default && mod.default.default) || null;
  } catch (err) {
    return null;
  }
}

const PrismaCtor = loadPrismaClient();
if (!PrismaCtor) {
  throw new Error('@prisma/client could not be loaded. Ensure it is installed and compatible with the runtime.');
}

const prisma = new PrismaCtor({
  errorFormat: 'pretty',
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
}) as Prisma.PrismaClient;

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
    await prisma.$queryRawUnsafe('SELECT 1');
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
        password: '$2a$10$ce69hcSKRVDoGecQd69TcOlIZeKCSp/wMt/t3Y1l7oL5miYbU83zK', // password: Admin@123
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
