// Dashboard Service for statistics

import prisma from '@backend/utils/database';
import Logger from '@shared/utils/logger';
import { DashboardStats, TicketStatus } from '@shared/types/index';
import { ParkingSlotService } from './ParkingSlotService';

const logger = new Logger('DashboardService');

export class DashboardService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(parkingLotId?: string): Promise<DashboardStats> {
    logger.info('Fetching dashboard statistics', { parkingLotId });

    try {
      const where = parkingLotId ? { parkingLotId } : {};

      // Get slot statistics
      const slotStats = await prisma.parkingSlot.groupBy({
        by: ['status'],
        where,
        _count: true,
      });

      const totalSlots = slotStats.reduce((sum, s) => sum + s._count, 0);
      const occupiedSlots = slotStats.find((s) => s.status === 'OCCUPIED')?._count || 0;
      const availableSlots = slotStats.find((s) => s.status === 'AVAILABLE')?._count || 0;
      const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

      // Get revenue statistics for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayCharges = await prisma.charge.findMany({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          ticket: where.parkingLotId ? { parkingSlot: { parkingLotId } } : undefined,
        },
        include: { ticket: true },
      });

      const todayRevenue = todayCharges.reduce((sum, c) => sum + c.totalAmount, 0);
      const completedTickets = todayCharges.filter(
        (c) => c.ticket.status === 'COMPLETED'
      ).length;

      // Get total revenue
      const allCharges = await prisma.charge.findMany({
        where: {
          ticket: where.parkingLotId ? { parkingSlot: { parkingLotId } } : undefined,
        },
      });

      const totalRevenue = allCharges.reduce((sum, c) => sum + c.totalAmount, 0);

      // Get active tickets
      const activeTickets = await prisma.ticket.count({
        where: {
          status: 'ACTIVE',
          parkingSlot: where,
        },
      });

      // Get today's tickets
      const todayTickets = await prisma.ticket.count({
        where: {
          entryTime: { gte: today, lt: tomorrow },
          parkingSlot: where,
        },
      });

      // Calculate averages
      const totalCompletedTickets = await prisma.ticket.count({
        where: {
          status: 'COMPLETED',
          parkingSlot: where,
        },
      });

      const allTickets = await prisma.ticket.findMany({
        where: {
          status: 'COMPLETED',
          parkingSlot: where,
        },
        select: { duration: true },
      });

      const averageStayDuration = allTickets.length > 0
        ? Math.round(allTickets.reduce((sum, t) => sum + (t.duration || 0), 0) / allTickets.length)
        : 0;

      const averageCharge = totalCompletedTickets > 0 ? totalRevenue / totalCompletedTickets : 0;

      return {
        totalSlots,
        occupiedSlots,
        availableSlots,
        occupancyRate,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        activeTickets,
        todayTickets,
        averageStayDuration,
        averageCharge: Math.round(averageCharge * 100) / 100,
      };
    } catch (error) {
      logger.error('Failed to fetch dashboard statistics', error as Error);
      throw error;
    }
  }

  /**
   * Get widgets configuration
   */
  static async getWidgets(): Promise<any[]> {
    const widgets = await prisma.dashboardWidget.findMany({
      orderBy: { order: 'asc' },
    });

    return widgets.map((w) => ({
      ...w,
      config: w.config ? JSON.parse(w.config) : {},
    }));
  }

  /**
   * Update widget configuration
   */
  static async updateWidget(widgetId: string, config: Record<string, any>): Promise<any> {
    const widget = await prisma.dashboardWidget.update({
      where: { id: widgetId },
      data: {
        config: JSON.stringify(config),
      },
    });

    return {
      ...widget,
      config: JSON.parse(widget.config || '{}'),
    };
  }

  /**
   * Get hourly statistics
   */
  static async getHourlyStats(date?: Date): Promise<any[]> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const tickets = await prisma.ticket.findMany({
      where: {
        entryTime: { gte: startOfDay, lte: endOfDay },
      },
      include: { charges: true },
    });

    const hourlyData: Record<number, { hour: number; count: number; revenue: number }> = {};

    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = { hour, count: 0, revenue: 0 };
    }

    tickets.forEach((ticket) => {
      const hour = new Date(ticket.entryTime).getHours();
      hourlyData[hour].count++;
      if (ticket.charges) {
        hourlyData[hour].revenue += ticket.charges.totalAmount;
      }
    });

    return Object.values(hourlyData);
  }

  /**
   * Get zone-wise statistics
   */
  static async getZoneStats(parkingLotId: string): Promise<any[]> {
    const slots = await prisma.parkingSlot.findMany({
      where: { parkingLotId },
    });

    const zoneStats: Record<string, any> = {};

    slots.forEach((slot) => {
      if (!zoneStats[slot.zone]) {
        zoneStats[slot.zone] = {
          zone: slot.zone,
          total: 0,
          occupied: 0,
          available: 0,
          occupancyRate: 0,
        };
      }
      zoneStats[slot.zone].total++;
      if (slot.status === 'OCCUPIED') zoneStats[slot.zone].occupied++;
      if (slot.status === 'AVAILABLE') zoneStats[slot.zone].available++;
    });

    // Calculate occupancy rates
    for (const zone in zoneStats) {
      const zone_data = zoneStats[zone];
      zone_data.occupancyRate = zone_data.total > 0
        ? Math.round((zone_data.occupied / zone_data.total) * 100)
        : 0;
    }

    return Object.values(zoneStats);
  }

  /**
   * Get vehicle type statistics
   */
  static async getVehicleTypeStats(fromDate?: Date, toDate?: Date): Promise<any[]> {
    const where: any = {};

    if (fromDate || toDate) {
      where.entryTime = {};
      if (fromDate) where.entryTime.gte = fromDate;
      if (toDate) where.entryTime.lte = toDate;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      select: { vehicleType: true },
    });

    const vehicleStats: Record<string, number> = {};

    tickets.forEach((ticket) => {
      vehicleStats[ticket.vehicleType] = (vehicleStats[ticket.vehicleType] || 0) + 1;
    });

    return Object.entries(vehicleStats).map(([type, count]) => ({
      vehicleType: type,
      count,
    }));
  }

  /**
   * Get payment method statistics
   */
  static async getPaymentStats(fromDate?: Date, toDate?: Date): Promise<any[]> {
    const where: any = {};

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    const charges = await prisma.charge.findMany({
      where,
      select: { paymentMethod: true, totalAmount: true },
    });

    const paymentStats: Record<string, { count: number; total: number }> = {
      CASH: { count: 0, total: 0 },
      CARD: { count: 0, total: 0 },
      ONLINE: { count: 0, total: 0 },
      CHEQUE: { count: 0, total: 0 },
    };

    charges.forEach((charge) => {
      const method = charge.paymentMethod;
      paymentStats[method].count++;
      paymentStats[method].total += charge.totalAmount;
    });

    return Object.entries(paymentStats).map(([method, data]) => ({
      paymentMethod: method,
      ...data,
      average: data.count > 0 ? Math.round((data.total / data.count) * 100) / 100 : 0,
    }));
  }
}
