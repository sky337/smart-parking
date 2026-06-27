// Application-wide types and interfaces

// ===== Auth & User Types =====
export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OPERATOR = 'OPERATOR',
  ACCOUNTANT = 'ACCOUNTANT',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// ===== Parking Lot Types =====
export interface ParkingLot {
  id: string;
  name: string;
  totalSlots: number;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: LotStatus;
  createdAt: Date;
}

export enum LotStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

export interface ParkingSlot {
  id: string;
  slotNumber: string;
  floor: number;
  zone: string;
  slotType: SlotType;
  status: SlotStatus;
  coordinates?: { x: number; y: number };
  parkingLotId: string;
  createdAt: Date;
}

export enum SlotType {
  STANDARD = 'STANDARD',
  COMPACT = 'COMPACT',
  HANDICAP = 'HANDICAP',
  RESERVED = 'RESERVED',
  PREMIUM = 'PREMIUM',
}

export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  MAINTENANCE = 'MAINTENANCE',
  BLOCKED = 'BLOCKED',
}

// ===== Pricing Types =====
export interface PricingRule {
  id: string;
  name: string;
  slotType: SlotType;
  baseRate: number;
  maxDailyRate?: number;
  minimumDuration: number;
  overtimeRate?: number;
  weekendMultiplier: number;
  holidayMultiplier: number;
  description?: string;
  status: RuleStatus;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export enum RuleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

// ===== Ticket Types =====
export interface Ticket {
  id: string;
  ticketNumber: string;
  vehicleNumber: string;
  vehicleType: string;
  vehicleColor?: string;
  entryTime: Date;
  exitTime?: Date;
  duration?: number;
  parkingSlotId: string;
  operatorId: string;
  status: TicketStatus;
  createdAt: Date;
}

export enum TicketStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  LOST_TICKET = 'LOST_TICKET',
}

export interface Charge {
  id: string;
  ticketId: string;
  baseCharge: number;
  overtimeCharge: number;
  miscellaneous: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  ONLINE = 'ONLINE',
  CHEQUE = 'CHEQUE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// ===== Receipt Types =====
export interface Receipt {
  id: string;
  receiptNumber: string;
  ticketId: string;
  chargeId: string;
  generatedAt: Date;
  printedAt?: Date;
  printedCount: number;
  format: ReceiptFormat;
  status: ReceiptStatus;
}

export enum ReceiptFormat {
  THERMAL = 'THERMAL',
  A4 = 'A4',
  PDF = 'PDF',
}

export enum ReceiptStatus {
  GENERATED = 'GENERATED',
  PRINTED = 'PRINTED',
  ARCHIVED = 'ARCHIVED',
  CANCELLED = 'CANCELLED',
}

// ===== Report Types =====
export interface Report {
  id: string;
  reportType: ReportType;
  title: string;
  description?: string;
  generatedBy: string;
  fromDate: Date;
  toDate: Date;
  fileUrl?: string;
  format: ExportFormat;
  status: ReportStatus;
  totalRecords: number;
  createdAt: Date;
}

export enum ReportType {
  DAILY_SUMMARY = 'DAILY_SUMMARY',
  REVENUE_REPORT = 'REVENUE_REPORT',
  OCCUPANCY_REPORT = 'OCCUPANCY_REPORT',
  VEHICLE_HISTORY = 'VEHICLE_HISTORY',
  PAYMENT_REPORT = 'PAYMENT_REPORT',
  OPERATOR_PERFORMANCE = 'OPERATOR_PERFORMANCE',
  SLOT_UTILIZATION = 'SLOT_UTILIZATION',
}

export enum ExportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
}

export enum ReportStatus {
  GENERATED = 'GENERATED',
  EXPORTED = 'EXPORTED',
  ARCHIVED = 'ARCHIVED',
}

// ===== Backup Types =====
export interface DatabaseBackup {
  id: string;
  backupName: string;
  backupPath: string;
  backupSize: number;
  createdBy: string;
  restoredAt?: Date;
  status: BackupStatus;
  createdAt: Date;
}

export enum BackupStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  VERIFIED = 'VERIFIED',
}

// ===== Common Response Types =====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ===== IPC Event Types =====
export interface IpcRequest<T = any> {
  channel: string;
  data: T;
}

export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ===== Dashboard Types =====
export interface DashboardStats {
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  occupancyRate: number;
  totalRevenue: number;
  todayRevenue: number;
  activeTickets: number;
  todayTickets: number;
  averageStayDuration: number;
  averageCharge: number;
}

export interface DashboardWidget {
  id: string;
  name: string;
  type: string;
  config?: Record<string, any>;
  order: number;
}
