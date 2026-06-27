// Validation utilities

import { VALIDATION } from '../constants/index';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export class Validator {
  static validateEmail(email: string): boolean {
    return VALIDATION.EMAIL_REGEX.test(email);
  }

  static validateUsername(username: string): boolean {
    return (
      username.length >= VALIDATION.USERNAME_MIN_LENGTH &&
      username.length <= VALIDATION.USERNAME_MAX_LENGTH &&
      /^[a-zA-Z0-9_]+$/.test(username)
    );
  }

  static validatePassword(password: string): boolean {
    return VALIDATION.PASSWORD_REGEX.test(password);
  }

  static validateVehicleNumber(vehicleNumber: string): boolean {
    // Flexible validation - accepts various formats
    return vehicleNumber.length >= 6 && vehicleNumber.length <= 15;
  }

  static validatePhoneNumber(phone: string): boolean {
    return VALIDATION.PHONE_REGEX.test(phone);
  }

  static validateSlotNumber(slotNumber: string): boolean {
    return slotNumber.length > 0 && slotNumber.length <= 50;
  }

  static validateRate(rate: number): boolean {
    return rate > 0 && !isNaN(rate) && isFinite(rate);
  }

  static validatePercentage(percentage: number): boolean {
    return percentage >= 0 && percentage <= 100;
  }

  static validateDuration(duration: number): boolean {
    return duration > 0 && Number.isInteger(duration);
  }

  static validateLoginRequest(username: string, password: string): ValidationResult {
    const errors: Record<string, string> = {};

    if (!username || !username.trim()) {
      errors.username = 'Username is required';
    } else if (!this.validateUsername(username)) {
      errors.username = 'Invalid username format';
    }

    if (!password || !password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      errors.password = `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`;
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static validateUserCreation(data: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): ValidationResult {
    const errors: Record<string, string> = {};

    if (!this.validateUsername(data.username)) {
      errors.username = 'Invalid username format';
    }

    if (!this.validateEmail(data.email)) {
      errors.email = 'Invalid email format';
    }

    if (!this.validatePassword(data.password)) {
      errors.password = 'Password must contain uppercase, lowercase, number, and special character';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static validateParkingLot(data: {
    name: string;
    totalSlots: number;
    address?: string;
  }): ValidationResult {
    const errors: Record<string, string> = {};

    if (!data.name || !data.name.trim()) {
      errors.name = 'Parking lot name is required';
    }

    if (!data.totalSlots || data.totalSlots <= 0) {
      errors.totalSlots = 'Total slots must be a positive number';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static validateTicketCreation(data: {
    vehicleNumber: string;
    slotId: string;
  }): ValidationResult {
    const errors: Record<string, string> = {};

    if (!this.validateVehicleNumber(data.vehicleNumber)) {
      errors.vehicleNumber = 'Invalid vehicle number format';
    }

    if (!data.slotId || !data.slotId.trim()) {
      errors.slotId = 'Parking slot is required';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static validatePricingRule(data: {
    name: string;
    baseRate: number;
    minimumDuration?: number;
  }): ValidationResult {
    const errors: Record<string, string> = {};

    if (!data.name || !data.name.trim()) {
      errors.name = 'Pricing rule name is required';
    }

    if (!this.validateRate(data.baseRate)) {
      errors.baseRate = 'Base rate must be a positive number';
    }

    if (data.minimumDuration && !this.validateDuration(data.minimumDuration)) {
      errors.minimumDuration = 'Minimum duration must be a positive integer';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove script tags
    .substring(0, 1000); // Limit length
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]);
    }
  }
  return sanitized;
}
