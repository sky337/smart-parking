// Utility functions for common operations

import { v4 as uuidv4 } from 'uuid';
import { TICKET_NUMBER_PREFIX, TICKET_NUMBER_LENGTH, RECEIPT_NUMBER_PREFIX, RECEIPT_NUMBER_LENGTH } from '../constants/index';

/**
 * Generate a unique UUID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generate a ticket number
 */
export function generateTicketNumber(): string {
  const randomPart = Math.random().toString(36).substring(2, TICKET_NUMBER_LENGTH).toUpperCase();
  const timestamp = Date.now().toString().slice(-3);
  return `${TICKET_NUMBER_PREFIX}${timestamp}${randomPart}`;
}

/**
 * Generate a receipt number
 */
export function generateReceiptNumber(): string {
  const randomPart = Math.random().toString(36).substring(2, RECEIPT_NUMBER_LENGTH).toUpperCase();
  const timestamp = Date.now().toString().slice(-3);
  return `${RECEIPT_NUMBER_PREFIX}${timestamp}${randomPart}`;
}

/**
 * Calculate duration in minutes between two dates
 */
export function calculateDuration(startDate: Date, endDate: Date): number {
  const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.ceil(diffMs / 60000); // Convert ms to minutes
}

/**
 * Format date to ISO string
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format time in HH:MM:SS format
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Parse ISO date string
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is weekend
 */
export function isWeekend(date: Date): boolean {
  const day = new Date(date).getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Calculate parking charges
 */
export interface ChargeParams {
  baserate: number;
  durationMinutes: number;
  isWeekend: boolean;
  isHoliday: boolean;
  weekendMultiplier: number;
  holidayMultiplier: number;
  overtimeRate?: number;
  maxDailyRate?: number;
  taxPercentage: number;
  discount: number;
}

export function calculateCharges({
  baserate,
  durationMinutes,
  isWeekend,
  isHoliday,
  weekendMultiplier,
  holidayMultiplier,
  overtimeRate,
  maxDailyRate,
  taxPercentage,
  discount,
}: ChargeParams): {
  baseCharge: number;
  overtimeCharge: number;
  taxAmount: number;
  totalBeforeDiscount: number;
  finalAmount: number;
} {
  // Calculate hours
  const hours = durationMinutes / 60;

  // Apply multipliers
  let rate = baserate;
  if (isHoliday) {
    rate *= holidayMultiplier;
  } else if (isWeekend) {
    rate *= weekendMultiplier;
  }

  // Calculate base charge
  let baseCharge = rate * hours;

  // Apply daily cap if exists
  if (maxDailyRate && baseCharge > maxDailyRate) {
    baseCharge = maxDailyRate;
  }

  // Calculate overtime charge
  let overtimeCharge = 0;
  if (overtimeRate && hours > 24) {
    overtimeCharge = (hours - 24) * overtimeRate;
  }

  // Calculate subtotal
  const subtotal = baseCharge + overtimeCharge - discount;
  const taxAmount = (subtotal * taxPercentage) / 100;
  const totalBeforeDiscount = baseCharge + overtimeCharge;
  const finalAmount = subtotal + taxAmount;

  return {
    baseCharge: Math.round(baseCharge * 100) / 100,
    overtimeCharge: Math.round(overtimeCharge * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalBeforeDiscount: Math.round(totalBeforeDiscount * 100) / 100,
    finalAmount: Math.round(finalAmount * 100) / 100,
  };
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        !(source[key] instanceof Date)
      ) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key] as any;
      }
    }
  }

  return result;
}

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts - 1) {
        const delayMs = initialDelay * Math.pow(2, attempt);
        await delay(delayMs);
      }
    }
  }

  throw lastError || new Error('Max retry attempts reached');
}

/**
 * Generate pagination metadata
 */
export function generatePagination(total: number, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    hasNextPage: page < Math.ceil(total / pageSize),
    hasPrevPage: page > 1,
  };
}

/**
 * Calculate occupancy percentage
 */
export function calculateOccupancy(occupied: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((occupied / total) * 100);
}
