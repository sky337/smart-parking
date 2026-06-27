// Ticket Management Service

import prisma from '@backend/utils/database';
import Logger from '@shared/utils/logger';
import { NotFoundError, ValidationError, BusinessLogicError } from '@shared/utils/errors';
import { Validator } from '@shared/utils/validator';
import { generateTicketNumber, calculateDuration, calculateCharges, isWeekend } from '@shared/utils/helpers';
import { Ticket, TicketStatus } from '@shared/types/index';
import { ParkingSlotService } from './ParkingSlotService';

const logger = new Logger('TicketService');

export class TicketService {
  /**
   * Create entry ticket
   */
  static async createTicket(data: {
    vehicleNumber: string;
    slotId: string;
    operatorId: string;
    vehicleType?: string;
    vehicleColor?: string;
  }): Promise<Ticket> {
    logger.info('Creating entry ticket', { vehicleNumber: data.vehicleNumber, slotId: data.slotId });

    // Validate input
    const validation = Validator.validateTicketCreation(data);
    if (!validation.valid) {
      throw new ValidationError('Invalid ticket data', validation.errors);
    }

    // Verify slot exists and is available
    const slot = await ParkingSlotService.getSlot(data.slotId);
    if (slot.status !== 'AVAILABLE') {
      throw new BusinessLogicError('Parking slot is not available', 'SLOT_UNAVAILABLE');
    }

    // Generate ticket number
    const ticketNumber = generateTicketNumber();

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        vehicleNumber: data.vehicleNumber.toUpperCase(),
        vehicleType: data.vehicleType || 'CAR',
        vehicleColor: data.vehicleColor,
        entryTime: new Date(),
        parkingSlotId: data.slotId,
        operatorId: data.operatorId,
        status: 'ACTIVE',
      },
    });

    // Update slot status
    await ParkingSlotService.updateSlotStatus(data.slotId, 'OCCUPIED');

    logger.info('Entry ticket created', { ticketId: ticket.id, ticketNumber });

    return ticket as any;
  }

  /**
   * Create exit ticket and calculate charges
   */
  static async exitTicket(ticketId: string, operatorId: string): Promise<{
    ticket: Ticket;
    charges: any;
  }> {
    logger.info('Processing ticket exit', { ticketId });

    // Get ticket
    const ticket = await this.getTicket(ticketId);

    if (ticket.status !== 'ACTIVE') {
      throw new BusinessLogicError('Ticket is not active', 'INVALID_TICKET');
    }

    if (ticket.exitTime) {
      throw new BusinessLogicError('Ticket already marked as exited');
    }

    // Calculate duration
    const exitTime = new Date();
    const duration = calculateDuration(ticket.entryTime, exitTime);

    // Get pricing rules for slot
    const slot = await ParkingSlotService.getSlot(ticket.parkingSlotId);
    const lot = await prisma.parkingLot.findUnique({
      where: { id: slot.parkingLotId },
    });

    if (!lot) {
      throw new NotFoundError('Parking lot not found');
    }

    const pricingRule = await prisma.pricingRule.findFirst({
      where: {
        parkingLotId: lot.id,
        slotType: slot.slotType,
        status: 'ACTIVE',
      },
    });

    if (!pricingRule) {
      throw new NotFoundError('Pricing rule not found for this slot type');
    }

    // Calculate charges
    const chargesDetails = calculateCharges({
      baserate: pricingRule.baseRate,
      durationMinutes: Math.max(duration, pricingRule.minimumDuration),
      isWeekend: isWeekend(exitTime),
      isHoliday: false, // Can be enhanced with holiday database
      weekendMultiplier: pricingRule.weekendMultiplier,
      holidayMultiplier: pricingRule.holidayMultiplier,
      overtimeRate: pricingRule.overtimeRate,
      maxDailyRate: pricingRule.maxDailyRate,
      taxPercentage: 5, // Could be configurable
      discount: 0,
    });

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        exitTime,
        duration,
        status: 'COMPLETED',
      },
    });

    // Create charge record
    const charge = await prisma.charge.create({
      data: {
        ticketId,
        baseCharge: chargesDetails.baseCharge,
        overtimeCharge: chargesDetails.overtimeCharge,
        tax: chargesDetails.taxAmount,
        totalAmount: chargesDetails.finalAmount,
        paymentStatus: 'PENDING',
        paymentMethod: 'CASH', // Default, can be updated later
      },
    });

    // Update slot status
    await ParkingSlotService.updateSlotStatus(ticket.parkingSlotId, 'AVAILABLE');

    logger.info('Ticket exit processed', { ticketId, duration, totalCharge: chargesDetails.finalAmount });

    return {
      ticket: updatedTicket as any,
      charges: {
        ...chargesDetails,
        id: charge.id,
        paymentStatus: charge.paymentStatus,
      },
    };
  }

  /**
   * Get ticket by ID
   */
  static async getTicket(ticketId: string): Promise<Ticket> {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { charges: true, parkingSlot: true },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    return ticket as any;
  }

  /**
   * Get ticket by ticket number
   */
  static async getTicketByNumber(ticketNumber: string): Promise<Ticket> {
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
      include: { charges: true, parkingSlot: true },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    return ticket as any;
  }

  /**
   * Search tickets
   */
  static async searchTickets(filters: {
    vehicleNumber?: string;
    slotId?: string;
    status?: TicketStatus;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ tickets: Ticket[]; total: number }> {
    logger.info('Searching tickets', filters);

    const where: any = {};

    if (filters.vehicleNumber) {
      where.vehicleNumber = { contains: filters.vehicleNumber.toUpperCase() };
    }
    if (filters.slotId) {
      where.parkingSlotId = filters.slotId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.fromDate || filters.toDate) {
      where.entryTime = {};
      if (filters.fromDate) {
        where.entryTime.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.entryTime.lte = filters.toDate;
      }
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: { charges: true },
        orderBy: { entryTime: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      prisma.ticket.count({ where }),
    ]);

    return {
      tickets: tickets as any,
      total,
    };
  }

  /**
   * Cancel ticket
   */
  static async cancelTicket(ticketId: string, reason?: string): Promise<Ticket> {
    logger.info('Cancelling ticket', { ticketId, reason });

    const ticket = await this.getTicket(ticketId);

    if (ticket.status === 'CANCELLED') {
      throw new BusinessLogicError('Ticket already cancelled');
    }

    const cancelled = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'CANCELLED' },
    });

    // Free up slot
    await ParkingSlotService.updateSlotStatus(ticket.parkingSlotId, 'AVAILABLE');

    logger.info('Ticket cancelled', { ticketId });

    return cancelled as any;
  }

  /**
   * Get today's tickets
   */
  static async getTodayTickets(): Promise<Ticket[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tickets = await prisma.ticket.findMany({
      where: {
        entryTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: { charges: true },
      orderBy: { entryTime: 'desc' },
    });

    return tickets as any;
  }
}
