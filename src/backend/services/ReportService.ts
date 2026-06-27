// Report Generation and Export Service

import prisma from '@backend/utils/database';
import Logger from '@shared/utils/logger';
import { NotFoundError } from '@shared/utils/errors';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';

const logger = new Logger('ReportService');

export class ReportService {
  private static reportsDir = path.join(process.cwd(), 'reports');

  constructor() {
    if (!fs.existsSync(ReportService.reportsDir)) {
      fs.mkdirSync(ReportService.reportsDir, { recursive: true });
    }
  }

  /**
   * Generate daily summary report
   */
  static async generateDailySummary(date: Date): Promise<any> {
    logger.info('Generating daily summary report', { date: date.toDateString() });

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get tickets for the day
    const tickets = await prisma.ticket.findMany({
      where: {
        entryTime: { gte: startDate, lte: endDate },
      },
      include: { charges: true },
    });

    const charges = await prisma.charge.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const totalRevenue = charges.reduce((sum, charge) => sum + charge.totalAmount, 0);
    const completedTickets = tickets.filter((t) => t.status === 'COMPLETED').length;

    return {
      date: date.toDateString(),
      totalTickets: tickets.length,
      completedTickets,
      cancelledTickets: tickets.filter((t) => t.status === 'CANCELLED').length,
      totalRevenue,
      averageCharge: completedTickets > 0 ? totalRevenue / completedTickets : 0,
      paymentBreakdown: this.getPaymentBreakdown(charges),
    };
  }

  /**
   * Generate revenue report
   */
  static async generateRevenueReport(fromDate: Date, toDate: Date): Promise<any> {
    logger.info('Generating revenue report', { fromDate, toDate });

    const charges = await prisma.charge.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
      },
      include: { ticket: true },
    });

    const totalRevenue = charges.reduce((sum, charge) => sum + charge.totalAmount, 0);
    const paymentMethods = this.groupByPaymentMethod(charges);

    return {
      fromDate,
      toDate,
      totalRevenue,
      totalTransactions: charges.length,
      averageTransaction: charges.length > 0 ? totalRevenue / charges.length : 0,
      paymentMethods,
      dailyBreakdown: this.getDailyBreakdown(charges),
    };
  }

  /**
   * Generate occupancy report
   */
  static async generateOccupancyReport(): Promise<any> {
    logger.info('Generating occupancy report');

    const lots = await prisma.parkingLot.findMany({
      include: { slots: true },
    });

    const occupancyData = lots.map((lot) => {
      const total = lot.slots.length;
      const occupied = lot.slots.filter((s) => s.status === 'OCCUPIED').length;
      const available = lot.slots.filter((s) => s.status === 'AVAILABLE').length;

      return {
        lotName: lot.name,
        totalSlots: total,
        occupied,
        available,
        occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
        zones: this.getZoneOccupancy(lot.slots),
      };
    });

    return {
      generatedAt: new Date(),
      lots: occupancyData,
    };
  }

  /**
   * Export report to PDF
   */
  static async exportToPDF(reportType: string, reportData: any): Promise<string> {
    logger.info('Exporting report to PDF', { reportType });

    const filename = `${reportType}_${Date.now()}.pdf`;
    const filepath = path.join(ReportService.reportsDir, filename);

    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Title
    doc.fontSize(20).text('Smart Parking Management System', { align: 'center' });
    doc.fontSize(14).text(`${reportType} Report`, { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    // Content
    this.formatReportContent(doc, reportData);

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    logger.info('PDF exported successfully', { filename });

    return filepath;
  }

  /**
   * Export report to Excel
   */
  static async exportToExcel(reportType: string, reportData: any): Promise<string> {
    logger.info('Exporting report to Excel', { reportType });

    const filename = `${reportType}_${Date.now()}.xlsx`;
    const filepath = path.join(ReportService.reportsDir, filename);

    // Convert report data to worksheet format
    const wsData = this.convertToWorksheetData(reportData);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');

    XLSX.writeFile(wb, filepath);

    logger.info('Excel exported successfully', { filename });

    return filepath;
  }

  /**
   * Save report metadata
   */
  static async saveReport(data: {
    reportType: string;
    title: string;
    generatedBy: string;
    fromDate: Date;
    toDate: Date;
    format: 'PDF' | 'EXCEL';
    fileUrl: string;
  }): Promise<any> {
    const report = await prisma.report.create({
      data: {
        reportType: data.reportType as any,
        title: data.title,
        generatedBy: data.generatedBy,
        fromDate: data.fromDate,
        toDate: data.toDate,
        format: data.format as any,
        fileUrl: data.fileUrl,
        status: 'GENERATED',
      },
    });

    return report;
  }

  /**
   * Get payment breakdown
   */
  private static getPaymentBreakdown(charges: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {
      CASH: 0,
      CARD: 0,
      ONLINE: 0,
      CHEQUE: 0,
    };

    charges.forEach((charge) => {
      breakdown[charge.paymentMethod] = (breakdown[charge.paymentMethod] || 0) + charge.totalAmount;
    });

    return breakdown;
  }

  /**
   * Group charges by payment method
   */
  private static groupByPaymentMethod(charges: any[]): any[] {
    const grouped: Record<string, any> = {};

    charges.forEach((charge) => {
      if (!grouped[charge.paymentMethod]) {
        grouped[charge.paymentMethod] = {
          method: charge.paymentMethod,
          count: 0,
          total: 0,
        };
      }
      grouped[charge.paymentMethod].count++;
      grouped[charge.paymentMethod].total += charge.totalAmount;
    });

    return Object.values(grouped);
  }

  /**
   * Get daily breakdown
   */
  private static getDailyBreakdown(charges: any[]): any[] {
    const daily: Record<string, any> = {};

    charges.forEach((charge) => {
      const day = new Date(charge.createdAt).toDateString();
      if (!daily[day]) {
        daily[day] = { date: day, revenue: 0, count: 0 };
      }
      daily[day].revenue += charge.totalAmount;
      daily[day].count++;
    });

    return Object.values(daily);
  }

  /**
   * Get zone occupancy
   */
  private static getZoneOccupancy(slots: any[]): any[] {
    const zones: Record<string, any> = {};

    slots.forEach((slot) => {
      if (!zones[slot.zone]) {
        zones[slot.zone] = {
          zone: slot.zone,
          total: 0,
          occupied: 0,
          available: 0,
        };
      }
      zones[slot.zone].total++;
      if (slot.status === 'OCCUPIED') zones[slot.zone].occupied++;
      if (slot.status === 'AVAILABLE') zones[slot.zone].available++;
    });

    return Object.values(zones);
  }

  /**
   * Format report content for PDF
   */
  private static formatReportContent(doc: any, data: any): void {
    doc.fontSize(12);

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        doc.fontSize(11).text(`${key}:`, { underline: true });
        doc.fontSize(10).text(JSON.stringify(value, null, 2));
      } else {
        doc.text(`${key}: ${value}`);
      }
      doc.moveDown(0.5);
    }
  }

  /**
   * Convert report data to worksheet format
   */
  private static convertToWorksheetData(data: any): any[][] {
    const wsData: any[][] = [];

    // Add header
    wsData.push(['Smart Parking Management System - Report']);
    wsData.push([]);

    // Add data
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        wsData.push([key]);
        value.forEach((item) => {
          wsData.push([JSON.stringify(item)]);
        });
        wsData.push([]);
      } else if (typeof value === 'object' && value !== null) {
        wsData.push([key]);
        for (const [subKey, subValue] of Object.entries(value)) {
          wsData.push(['', subKey, subValue]);
        }
        wsData.push([]);
      } else {
        wsData.push([key, value]);
      }
    }

    return wsData;
  }
}
