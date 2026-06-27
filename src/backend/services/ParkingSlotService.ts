// Parking Slot Management Service

import prisma from '@backend/utils/database';
import Logger from '@shared/utils/logger';
import { NotFoundError, ValidationError, BusinessLogicError } from '@shared/utils/errors';
import { Validator } from '@shared/utils/validator';
import { ParkingSlot, SlotStatus, ParkingLot } from '@shared/types/index';

const logger = new Logger('ParkingSlotService');

export class ParkingSlotService {
  /**
   * Get all parking lots
   */
  static async getParkingLots(): Promise<ParkingLot[]> {
    try {
      const lots = await prisma.parkingLot.findMany({
        where: { /* deleted check could be added */ },
        include: {
          slots: true,
          pricingRules: { where: { status: 'ACTIVE' } },
        },
      });

      return lots as any;
    } catch (error) {
      logger.error('Failed to fetch parking lots', error as Error);
      throw error;
    }
  }

  /**
   * Create parking lot
   */
  static async createParkingLot(data: {
    name: string;
    totalSlots: number;
    address?: string;
    phone?: string;
    email?: string;
    description?: string;
  }): Promise<ParkingLot> {
    logger.info('Creating parking lot', { name: data.name });

    // Validate input
    const validation = Validator.validateParkingLot(data);
    if (!validation.valid) {
      throw new ValidationError('Invalid parking lot data', validation.errors);
    }

    // Check if lot name already exists
    const existing = await prisma.parkingLot.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new ValidationError('Parking lot with this name already exists');
    }

    // Create lot
    const lot = await prisma.parkingLot.create({
      data: {
        ...data,
        status: 'ACTIVE',
      },
    });

    logger.info('Parking lot created', { lotId: lot.id });

    return lot as any;
  }

  /**
   * Get all slots for a parking lot
   */
  static async getSlots(
    parkingLotId: string,
    status?: SlotStatus,
    zone?: string
  ): Promise<ParkingSlot[]> {
    logger.info('Fetching parking slots', { parkingLotId, status, zone });

    try {
      const slots = await prisma.parkingSlot.findMany({
        where: {
          parkingLotId,
          ...(status && { status }),
          ...(zone && { zone }),
        },
        orderBy: [{ zone: 'asc' }, { slotNumber: 'asc' }],
      });

      return slots as any;
    } catch (error) {
      logger.error('Failed to fetch slots', error as Error);
      throw error;
    }
  }

  /**
   * Get slot details
   */
  static async getSlot(slotId: string): Promise<ParkingSlot> {
    const slot = await prisma.parkingSlot.findUnique({
      where: { id: slotId },
      include: { tickets: { take: 1, orderBy: { createdAt: 'desc' } } },
    });

    if (!slot) {
      throw new NotFoundError('Parking slot not found');
    }

    return slot as any;
  }

  /**
   * Update slot status
   */
  static async updateSlotStatus(slotId: string, status: SlotStatus): Promise<ParkingSlot> {
    logger.info('Updating slot status', { slotId, status });

    const slot = await this.getSlot(slotId);

    if (slot.status === status) {
      return slot;
    }

    const updated = await prisma.parkingSlot.update({
      where: { id: slotId },
      data: { status },
    });

    logger.info('Slot status updated', { slotId, oldStatus: slot.status, newStatus: status });

    return updated as any;
  }

  /**
   * Get slot availability
   */
  static async getAvailabilityStats(parkingLotId: string) {
    const slots = await prisma.parkingSlot.groupBy({
      by: ['status'],
      where: { parkingLotId },
      _count: true,
    });

    const total = slots.reduce((sum, slot) => sum + slot._count, 0);
    const occupied = slots.find((s) => s.status === 'OCCUPIED')?._count || 0;
    const available = slots.find((s) => s.status === 'AVAILABLE')?._count || 0;

    return {
      total,
      occupied,
      available,
      reserved: slots.find((s) => s.status === 'RESERVED')?._count || 0,
      maintenance: slots.find((s) => s.status === 'MAINTENANCE')?._count || 0,
      occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    };
  }

  /**
   * Find available slot
   */
  static async findAvailableSlot(
    parkingLotId: string,
    slotType?: string,
    zone?: string
  ): Promise<ParkingSlot | null> {
    logger.debug('Finding available slot', { parkingLotId, slotType, zone });

    const slot = await prisma.parkingSlot.findFirst({
      where: {
        parkingLotId,
        status: 'AVAILABLE',
        ...(slotType && { slotType: slotType as any }),
        ...(zone && { zone }),
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!slot) {
      logger.debug('No available slots found', { parkingLotId, slotType, zone });
      return null;
    }

    return slot as any;
  }

  /**
   * Get slots by zone with visualization data
   */
  static async getZoneVisualization(parkingLotId: string) {
    const slots = await prisma.parkingSlot.findMany({
      where: { parkingLotId },
      orderBy: [{ zone: 'asc' }, { floor: 'asc' }, { slotNumber: 'asc' }],
    });

    // Group by zone and floor
    const grouped: Record<string, Record<number, any[]>> = {};

    for (const slot of slots) {
      if (!grouped[slot.zone]) {
        grouped[slot.zone] = {};
      }
      if (!grouped[slot.zone][slot.floor]) {
        grouped[slot.zone][slot.floor] = [];
      }
      grouped[slot.zone][slot.floor].push({
        id: slot.id,
        slotNumber: slot.slotNumber,
        status: slot.status,
        type: slot.slotType,
        coordinates: slot.coordinates ? JSON.parse(slot.coordinates) : null,
      });
    }

    return grouped;
  }
}
