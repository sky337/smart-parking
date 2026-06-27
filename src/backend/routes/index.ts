// API Routes - Express Router setup

import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler, authenticateToken, authorize } from '@backend/middleware/index';
import { AuthService } from '@backend/services/AuthService';
import { ParkingSlotService } from '@backend/services/ParkingSlotService';
import { TicketService } from '@backend/services/TicketService';
import { ReceiptService } from '@backend/services/ReceiptService';
import { ReportService } from '@backend/services/ReportService';
import { BackupService } from '@backend/services/BackupService';
import { DashboardService } from '@backend/services/DashboardService';
import Logger from '@shared/utils/logger';

const logger = new Logger('Routes');

const authRouter = Router();
const parkingRouter = Router();
const ticketRouter = Router();
const receiptRouter = Router();
const reportRouter = Router();
const backupRouter = Router();
const dashboardRouter = Router();

// ===== AUTH ROUTES =====
authRouter.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Login request', { username: req.body.username });
    const result = await AuthService.login(req.body);
    res.json({
      success: true,
      data: result,
    });
  })
);

authRouter.post(
  '/verify',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: req.user,
    });
  })
);

authRouter.post(
  '/refresh',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.refreshToken(req.token!);
    res.json({
      success: true,
      data: result,
    });
  })
);

// ===== PARKING ROUTES =====
parkingRouter.get(
  '/lots',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const lots = await ParkingSlotService.getParkingLots();
    res.json({
      success: true,
      data: lots,
    });
  })
);

parkingRouter.post(
  '/lots',
  authenticateToken,
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(async (req: Request, res: Response) => {
    const lot = await ParkingSlotService.createParkingLot(req.body);
    res.json({
      success: true,
      data: lot,
    });
  })
);

parkingRouter.get(
  '/slots/:lotId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { lotId } = req.params;
    const { status, zone } = req.query;
    const slots = await ParkingSlotService.getSlots(lotId, status as any, zone as string);
    res.json({
      success: true,
      data: slots,
    });
  })
);

parkingRouter.get(
  '/slots/:lotId/visualization',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { lotId } = req.params;
    const visualization = await ParkingSlotService.getZoneVisualization(lotId);
    res.json({
      success: true,
      data: visualization,
    });
  })
);

parkingRouter.get(
  '/slots/:lotId/availability',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { lotId } = req.params;
    const stats = await ParkingSlotService.getAvailabilityStats(lotId);
    res.json({
      success: true,
      data: stats,
    });
  })
);

// ===== TICKET ROUTES =====
ticketRouter.post(
  '/entry',
  authenticateToken,
  authorize('OPERATOR'),
  asyncHandler(async (req: Request, res: Response) => {
    const ticket = await TicketService.createTicket({
      ...req.body,
      operatorId: req.user!.id,
    });
    res.json({
      success: true,
      data: ticket,
    });
  })
);

ticketRouter.post(
  '/:ticketId/exit',
  authenticateToken,
  authorize('OPERATOR'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await TicketService.exitTicket(req.params.ticketId, req.user!.id);
    res.json({
      success: true,
      data: result,
    });
  })
);

ticketRouter.get(
  '/:ticketId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const ticket = await TicketService.getTicket(req.params.ticketId);
    res.json({
      success: true,
      data: ticket,
    });
  })
);

ticketRouter.get(
  '/number/:ticketNumber',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const ticket = await TicketService.getTicketByNumber(req.params.ticketNumber);
    res.json({
      success: true,
      data: ticket,
    });
  })
);

ticketRouter.get(
  '',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { status, vehicleNumber, fromDate, toDate, limit, offset } = req.query;
    const result = await TicketService.searchTickets({
      status: status as any,
      vehicleNumber: vehicleNumber as string,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });
    res.json({
      success: true,
      data: result,
    });
  })
);

// ===== RECEIPT ROUTES =====
receiptRouter.post(
  '/:ticketId/:chargeId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const receipt = await ReceiptService.generateReceipt(req.params.ticketId, req.params.chargeId);
    res.json({
      success: true,
      data: receipt,
    });
  })
);

receiptRouter.get(
  '/:receiptId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const receipt = await ReceiptService.getReceipt(req.params.receiptId);
    res.json({
      success: true,
      data: receipt,
    });
  })
);

receiptRouter.post(
  '/:receiptId/print',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    await ReceiptService.markAsPrinted(req.params.receiptId);
    const receipt = await ReceiptService.getReceipt(req.params.receiptId);
    res.json({
      success: true,
      data: receipt,
    });
  })
);

// ===== REPORT ROUTES =====
reportRouter.post(
  '/daily',
  authenticateToken,
  authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'),
  asyncHandler(async (req: Request, res: Response) => {
    const { date } = req.body;
    const report = await ReportService.generateDailySummary(new Date(date));
    res.json({
      success: true,
      data: report,
    });
  })
);

reportRouter.post(
  '/revenue',
  authenticateToken,
  authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'),
  asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.body;
    const report = await ReportService.generateRevenueReport(new Date(fromDate), new Date(toDate));
    res.json({
      success: true,
      data: report,
    });
  })
);

reportRouter.post(
  '/occupancy',
  authenticateToken,
  authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'),
  asyncHandler(async (req: Request, res: Response) => {
    const report = await ReportService.generateOccupancyReport();
    res.json({
      success: true,
      data: report,
    });
  })
);

// ===== BACKUP ROUTES =====
backupRouter.post(
  '',
  authenticateToken,
  authorize('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const backup = await BackupService.createBackup(req.user!.id);
    res.json({
      success: true,
      data: backup,
    });
  })
);

backupRouter.get(
  '',
  authenticateToken,
  authorize('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const backups = await BackupService.listBackups();
    res.json({
      success: true,
      data: backups,
    });
  })
);

backupRouter.post(
  '/:backupId/restore',
  authenticateToken,
  authorize('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const backup = await BackupService.restoreBackup(req.params.backupId, req.user!.id);
    res.json({
      success: true,
      data: backup,
    });
  })
);

// ===== DASHBOARD ROUTES =====
dashboardRouter.get(
  '/stats',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { lotId } = req.query;
    const stats = await DashboardService.getDashboardStats(lotId as string);
    res.json({
      success: true,
      data: stats,
    });
  })
);

dashboardRouter.get(
  '/hourly-stats',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { date } = req.query;
    const stats = await DashboardService.getHourlyStats(date ? new Date(date as string) : undefined);
    res.json({
      success: true,
      data: stats,
    });
  })
);

dashboardRouter.get(
  '/zone-stats/:lotId',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await DashboardService.getZoneStats(req.params.lotId);
    res.json({
      success: true,
      data: stats,
    });
  })
);

export { authRouter, parkingRouter, ticketRouter, receiptRouter, reportRouter, backupRouter, dashboardRouter };
