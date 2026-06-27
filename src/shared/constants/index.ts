// Application constants

// ===== Role & Permission Constants =====
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  OPERATOR: 'OPERATOR',
  ACCOUNTANT: 'ACCOUNTANT',
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [USER_ROLES.ADMIN]: [
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'parking.manage',
    'pricing.manage',
    'reports.view',
    'backup.manage',
    'audit.view',
  ],
  [USER_ROLES.MANAGER]: [
    'parking.manage',
    'pricing.view',
    'reports.view',
    'tickets.view',
  ],
  [USER_ROLES.OPERATOR]: [
    'tickets.create',
    'tickets.view',
    'charges.create',
    'receipts.print',
  ],
  [USER_ROLES.ACCOUNTANT]: [
    'reports.view',
    'charges.view',
    'payments.view',
    'receipts.view',
  ],
};

// ===== Parking Constants =====
export const DEFAULT_PARKING_ZONES = ['A', 'B', 'C', 'D', 'E', 'F'];
export const PARKING_FLOORS_RANGE = { MIN: 1, MAX: 10 };
export const PARKING_SLOT_TYPES = ['STANDARD', 'COMPACT', 'HANDICAP', 'RESERVED', 'PREMIUM'];
export const PARKING_SLOT_STATUSES = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'BLOCKED'];

// ===== Pricing Constants =====
export const DEFAULT_MINIMUM_DURATION = 30; // Minutes
export const DEFAULT_WEEKEND_MULTIPLIER = 1.2;
export const DEFAULT_HOLIDAY_MULTIPLIER = 1.5;
export const DEFAULT_TAX_PERCENTAGE = 5; // %

// ===== Payment Constants =====
export const PAYMENT_METHODS = ['CASH', 'CARD', 'ONLINE', 'CHEQUE'];
export const PAYMENT_STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];

// ===== Ticket Constants =====
export const TICKET_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'LOST_TICKET'];
export const TICKET_NUMBER_PREFIX = 'TKT';
export const TICKET_NUMBER_LENGTH = 8; // After prefix

// ===== Receipt Constants =====
export const RECEIPT_FORMATS = ['THERMAL', 'A4', 'PDF'];
export const RECEIPT_NUMBER_PREFIX = 'RCP';
export const RECEIPT_NUMBER_LENGTH = 8;
export const THERMAL_RECEIPT_WIDTH = 80; // MM

// ===== Report Types =====
export const REPORT_TYPES = [
  'DAILY_SUMMARY',
  'REVENUE_REPORT',
  'OCCUPANCY_REPORT',
  'VEHICLE_HISTORY',
  'PAYMENT_REPORT',
  'OPERATOR_PERFORMANCE',
  'SLOT_UTILIZATION',
];

// ===== Validation Constants =====
export const VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  VEHICLE_NUMBER_REGEX: /^[A-Z]{2}[A-Z0-9]{2}[A-Z]{2}[0-9]{4}$/, // Indian format
  PHONE_REGEX: /^[6-9]\d{9}$/, // Indian format
};

// ===== Time Constants =====
export const HOURS_IN_DAY = 24;
export const MINUTES_IN_HOUR = 60;
export const SECONDS_IN_MINUTE = 60;
export const MILLISECONDS_IN_SECOND = 1000;

// ===== API Constants =====
export const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000';
export const API_TIMEOUT = 30000; // 30 seconds
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000; // 1 second

// ===== Database Constants =====
export const DATABASE_BACKUP_PREFIX = 'parking_backup';
export const DATABASE_BACKUP_RETENTION_DAYS = 30;

// ===== Cache Duration (in seconds) =====
export const CACHE_DURATION = {
  SHORT: 5 * 60, // 5 minutes
  MEDIUM: 15 * 60, // 15 minutes
  LONG: 60 * 60, // 1 hour
  VERY_LONG: 24 * 60 * 60, // 24 hours
};

// ===== Log Levels =====
export const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
} as const;

// ===== IPC Channels =====
export const IPC_CHANNELS = {
  // Auth
  'AUTH:LOGIN': 'auth:login',
  'AUTH:LOGOUT': 'auth:logout',
  'AUTH:VERIFY': 'auth:verify',
  'AUTH:REFRESH': 'auth:refresh',

  // Parking Lots
  'PARKING:GET_LOTS': 'parking:get-lots',
  'PARKING:CREATE_LOT': 'parking:create-lot',
  'PARKING:UPDATE_LOT': 'parking:update-lot',
  'PARKING:DELETE_LOT': 'parking:delete-lot',

  // Parking Slots
  'SLOTS:GET_SLOTS': 'slots:get-slots',
  'SLOTS:GET_SLOT': 'slots:get-slot',
  'SLOTS:UPDATE_SLOT': 'slots:update-slot',
  'SLOTS:GET_AVAILABILITY': 'slots:get-availability',

  // Tickets
  'TICKETS:CREATE': 'tickets:create',
  'TICKETS:GET': 'tickets:get',
  'TICKETS:EXIT': 'tickets:exit',
  'TICKETS:CANCEL': 'tickets:cancel',
  'TICKETS:SEARCH': 'tickets:search',

  // Charges
  'CHARGES:CALCULATE': 'charges:calculate',
  'CHARGES:GET': 'charges:get',
  'CHARGES:UPDATE_PAYMENT': 'charges:update-payment',

  // Receipts
  'RECEIPTS:GENERATE': 'receipts:generate',
  'RECEIPTS:PRINT': 'receipts:print',
  'RECEIPTS:REPRINT': 'receipts:reprint',

  // Reports
  'REPORTS:GENERATE': 'reports:generate',
  'REPORTS:EXPORT': 'reports:export',
  'REPORTS:GET': 'reports:get',

  // Backup
  'BACKUP:CREATE': 'backup:create',
  'BACKUP:RESTORE': 'backup:restore',
  'BACKUP:LIST': 'backup:list',

  // System
  'SYSTEM:HEALTH': 'system:health',
  'SYSTEM:GET_INFO': 'system:get-info',
} as const;

// ===== Error Codes =====
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SLOT_UNAVAILABLE: 'SLOT_UNAVAILABLE',
  INVALID_TICKET: 'INVALID_TICKET',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
} as const;

// ===== Application Settings =====
export const APP_CONFIG = {
  APP_NAME: process.env.VITE_APP_NAME || 'Smart Parking Management System',
  APP_VERSION: process.env.VITE_APP_VERSION || '1.0.0',
  ENABLE_DEVTOOLS: process.env.NODE_ENV === 'development',
  LOG_LEVEL: process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO',
};
