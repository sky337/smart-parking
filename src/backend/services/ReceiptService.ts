// Receipt and Printing Service

import prisma from '@backend/utils/database';
import Logger from '@shared/utils/logger';
import { NotFoundError, BusinessLogicError } from '@shared/utils/errors';
import { generateReceiptNumber } from '@shared/utils/helpers';
import { formatCurrency, formatDate, formatTime } from '@shared/utils/helpers';

const logger = new Logger('ReceiptService');

export class ReceiptService {
  /**
   * Generate receipt for ticket
   */
  static async generateReceipt(ticketId: string, chargeId: string): Promise<any> {
    logger.info('Generating receipt', { ticketId, chargeId });

    // Get ticket and charge details
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { charges: true, parkingSlot: { include: { parkingLot: true } } },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    const charge = await prisma.charge.findUnique({
      where: { id: chargeId },
    });

    if (!charge) {
      throw new NotFoundError('Charge record not found');
    }

    // Generate receipt number
    const receiptNumber = generateReceiptNumber();

    // Build receipt data
    const receiptData = {
      receiptNumber,
      ticketNumber: ticket.ticketNumber,
      parkingLot: ticket.parkingSlot.parkingLot.name,
      slotNumber: ticket.parkingSlot.slotNumber,
      vehicleNumber: ticket.vehicleNumber,
      vehicleType: ticket.vehicleType,
      entryTime: formatTime(new Date(ticket.entryTime)),
      entryDate: formatDate(new Date(ticket.entryTime)),
      exitTime: ticket.exitTime ? formatTime(new Date(ticket.exitTime)) : null,
      exitDate: ticket.exitTime ? formatDate(new Date(ticket.exitTime)) : null,
      duration: ticket.duration,
      charges: {
        baseCharge: charge.baseCharge,
        overtimeCharge: charge.overtimeCharge,
        subtotal: charge.baseCharge + charge.overtimeCharge,
        tax: charge.tax,
        discount: charge.discount,
        totalAmount: charge.totalAmount,
      },
      paymentMethod: charge.paymentMethod,
      paymentStatus: charge.paymentStatus,
      generatedAt: new Date().toISOString(),
    };

    // Create receipt record
    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber,
        ticketId,
        chargeId,
        format: 'THERMAL',
        data: JSON.stringify(receiptData),
        status: 'GENERATED',
      },
    });

    logger.info('Receipt generated', { receiptId: receipt.id, receiptNumber });

    return {
      id: receipt.id,
      receiptNumber,
      data: receiptData,
    };
  }

  /**
   * Format receipt for thermal printer (80mm)
   */
  static formatThermalReceipt(receiptData: any): string {
    const line = ''.padEnd(40, '-');
    const lines: string[] = [];

    lines.push('');
    lines.push('         PARKING SYSTEM RECEIPT');
    lines.push(line);
    lines.push(`Receipt #: ${receiptData.receiptNumber}`);
    lines.push(`Ticket #: ${receiptData.ticketNumber}`);
    lines.push(line);

    lines.push(`Parking Lot: ${receiptData.parkingLot}`);
    lines.push(`Slot: ${receiptData.slotNumber}`);
    lines.push(`Vehicle: ${receiptData.vehicleNumber}`);
    lines.push(`Type: ${receiptData.vehicleType}`);
    lines.push(line);

    lines.push(`Entry: ${receiptData.entryDate} ${receiptData.entryTime}`);
    if (receiptData.exitTime) {
      lines.push(`Exit: ${receiptData.exitDate} ${receiptData.exitTime}`);
      lines.push(`Duration: ${receiptData.duration} minutes`);
    }
    lines.push(line);

    lines.push('CHARGES:');
    lines.push(`Base Charge: ${formatCurrency(receiptData.charges.baseCharge)}`);
    if (receiptData.charges.overtimeCharge > 0) {
      lines.push(`Overtime: ${formatCurrency(receiptData.charges.overtimeCharge)}`);
    }
    if (receiptData.charges.discount > 0) {
      lines.push(`Discount: -${formatCurrency(receiptData.charges.discount)}`);
    }
    lines.push(`Tax: ${formatCurrency(receiptData.charges.tax)}`);
    lines.push(line);
    lines.push(`TOTAL: ${formatCurrency(receiptData.charges.totalAmount)}`);
    lines.push(`Payment: ${receiptData.paymentMethod}`);
    lines.push(`Status: ${receiptData.paymentStatus}`);
    lines.push(line);

    lines.push(`${new Date(receiptData.generatedAt).toLocaleString()}`);
    lines.push('Thank you for using our service!');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Mark receipt as printed
   */
  static async markAsPrinted(receiptId: string): Promise<void> {
    logger.info('Marking receipt as printed', { receiptId });

    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
    });

    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        printedAt: new Date(),
        printedCount: receipt.printedCount + 1,
        status: 'PRINTED',
      },
    });

    logger.info('Receipt marked as printed', { receiptId, count: receipt.printedCount + 1 });
  }

  /**
   * Get receipt
   */
  static async getReceipt(receiptId: string): Promise<any> {
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
    });

    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    return {
      ...receipt,
      data: JSON.parse(receipt.data),
    };
  }

  /**
   * Get receipt by number
   */
  static async getReceiptByNumber(receiptNumber: string): Promise<any> {
    const receipt = await prisma.receipt.findFirst({
      where: { receiptNumber },
    });

    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    return {
      ...receipt,
      data: JSON.parse(receipt.data),
    };
  }

  /**
   * Reprint receipt
   */
  static async reprintReceipt(receiptId: string): Promise<any> {
    await this.markAsPrinted(receiptId);
    return this.getReceipt(receiptId);
  }
}
