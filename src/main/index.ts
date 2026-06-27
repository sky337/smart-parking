// Electron Main Process

import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import ExpressServer from '@backend/index';
import Logger from '@shared/utils/logger';
import { IPC_CHANNELS } from '@shared/constants/index';
import { AuthService } from '@backend/services/AuthService';
import { ParkingSlotService } from '@backend/services/ParkingSlotService';
import { TicketService } from '@backend/services/TicketService';
import { ReceiptService } from '@backend/services/ReceiptService';
import { ReportService } from '@backend/services/ReportService';
import { BackupService } from '@backend/services/BackupService';
import { DashboardService } from '@backend/services/DashboardService';

const logger = new Logger('Main');

let mainWindow: BrowserWindow | null = null;
let expressServer: ExpressServer | null = null;
const isDevelopment = isDev;

/**
 * Create main application window
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/icon.png'),
  });

  if (isDevelopment) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(`file://${path.join(__dirname, '../renderer/index.html')}`);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  logger.info('Main window created');
}

/**
 * Create application menu
 */
function createMenu(): void {
  const template: any[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'Smart Parking Management System',
              message: 'Smart Parking Management System v1.0.0',
              detail: 'A production-ready parking management application',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Setup IPC handlers for authentication
 */
function setupAuthHandlers(): void {
  ipcMain.handle(IPC_CHANNELS['AUTH:LOGIN'], async (event, credentials) => {
    try {
      const result = await AuthService.login(credentials);
      return { success: true, data: result };
    } catch (error) {
      logger.error('Login failed', error as Error);
      return { success: false, error: (error as any).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS['AUTH:VERIFY'], async (event, token) => {
    try {
      const user = await AuthService.verifyToken(token);
      return { success: true, data: user };
    } catch (error) {
      logger.error('Token verification failed', error as Error);
      return { success: false, error: (error as any).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS['AUTH:REFRESH'], async (event, token) => {
    try {
      const result = await AuthService.refreshToken(token);
      return { success: true, data: result };
    } catch (error) {
      logger.error('Token refresh failed', error as Error);
      return { success: false, error: (error as any).message };
    }
  });
}

/**
 * Setup IPC handlers for parking management
 */
function setupParkingHandlers(): void {
  ipcMain.handle(IPC_CHANNELS['PARKING:GET_LOTS'], async () => {
    try {
      const lots = await ParkingSlotService.getParkingLots();
      return { success: true, data: lots };
    } catch (error) {
      logger.error('Get lots failed', error as Error);
      return { success: false, error: (error as any).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS['SLOTS:GET_SLOTS'], async (event, lotId, status, zone) => {
    try {
      const slots = await ParkingSlotService.getSlots(lotId, status, zone);
      return { success: true, data: slots };
    } catch (error) {
      logger.error('Get slots failed', error as Error);
      return { success: false, error: (error as any).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS['SLOTS:GET_AVAILABILITY'], async (event, lotId) => {
    try {
      const stats = await ParkingSlotService.getAvailabilityStats(lotId);
      return { success: true, data: stats };
    } catch (error) {
      logger.error('Get availability failed', error as Error);
      return { success: false, error: (error as any).message };
    }
  });
}

/**
 * Setup IPC handlers for tickets
 */
function setupTicketHandlers(): void {
  ipcMain.handle(IPC_CHANNELS['TICKETS:CREATE'], async (event, data) => {
    try {
      const ticket = await TicketService.createTicket(data);
      return { success: true, data: ticket };
    } catch (error) {
      logger.error('Create ticket failed', error as Error);
      return { success: false, error: (error as any).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS['TICKETS:EXIT'], async (event, ticketId, operatorId) => {
    try {
      const result = await TicketService.exitTicket(ticketId, operatorId);
      return { success: true, data: result };
    } catch (error) {
      logger.error('Exit ticket failed', error as Error);
      return { success: false, error: (error as any).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS['TICKETS:GET'], async (event, ticketId) => {
    try {
      const ticket = await TicketService.getTicket(ticketId);
      return { success: true, data: ticket };
    } catch (error) {
      logger.error('Get ticket failed', error as Error);
      return { success: false, error: (error as any).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS['TICKETS:SEARCH'], async (event, filters) => {
    try {
      const result = await TicketService.searchTickets(filters);
      return { success: true, data: result };
    } catch (error) {
      logger.error('Search tickets failed', error as Error);
      return { success: false, error: (error as any).message };
    }
  });
}

/**
 * Setup IPC handlers for receipts
 */
function setupReceiptHandlers(): void {
  ipcMain.handle(IPC_CHANNELS['RECEIPTS:GENERATE'], async (event, ticketId, chargeId) => {
    try {
      const receipt = await ReceiptService.generateReceipt(ticketId, chargeId);
      return { success: true, data: receipt };
    } catch (error) {
      logger.error('Generate receipt failed', error as Error);
      return { success: false, error: (error as any).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS['RECEIPTS:PRINT'], async (event, receiptId) => {
    try {
      await ReceiptService.markAsPrinted(receiptId);
      const receipt = await ReceiptService.getReceipt(receiptId);
      return { success: true, data: receipt };
    } catch (error) {
      logger.error('Print receipt failed', error as Error);
      return { success: false, error: (error as any).message };
    }
  });
}

/**
 * Setup IPC handlers for reports
 */
function setupReportHandlers(): void {
  ipcMain.handle(IPC_CHANNELS['REPORTS:GENERATE'], async (event, reportType, params) => {
    try {
      let reportData;
      switch (reportType) {
        case 'DAILY_SUMMARY':
          reportData = await ReportService.generateDailySummary(new Date(params.date));
          break;
        case 'REVENUE_REPORT':
          reportData = await ReportService.generateRevenueReport(
            new Date(params.fromDate),
            new Date(params.toDate)
          );
          break;
        case 'OCCUPANCY_REPORT':
          reportData = await ReportService.generateOccupancyReport();
          break;
        default:
          throw new Error('Unknown report type');
      }
      return { success: true, data: reportData };
    } catch (error) {
      logger.error('Generate report failed', error as Error);
      return { success: false, error: (error as any).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS['REPORTS:EXPORT'], async (event, reportType, format) => {
    try {
      let filepath;
      const reportData = {}; // Should be populated based on reportType
      if (format === 'PDF') {
        filepath = await ReportService.exportToPDF(reportType, reportData);
      } else if (format === 'EXCEL') {
        filepath = await ReportService.exportToExcel(reportType, reportData);
      }
      return { success: true, data: { filepath } };
    } catch (error) {
      logger.error('Export report failed', error as Error);
      return { success: false, error: (error as any).message };
    }
  });
}

/**
 * Setup IPC handlers for backup
 */
function setupBackupHandlers(): void {
  ipcMain.handle(IPC_CHANNELS['BACKUP:CREATE'], async (event, userId) => {
    try {
      const backup = await BackupService.createBackup(userId);
      return { success: true, data: backup };
    } catch (error) {
      logger.error('Create backup failed', error as Error);
      return { success: false, error: (error as any).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS['BACKUP:LIST'], async () => {
    try {
      const backups = await BackupService.listBackups();
      return { success: true, data: backups };
    } catch (error) {
      logger.error('List backups failed', error as Error);
      return { success: false, error: (error as any).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS['BACKUP:RESTORE'], async (event, backupId) => {
    try {
      const backup = await BackupService.restoreBackup(backupId, 'admin');
      return { success: true, data: backup };
    } catch (error) {
      logger.error('Restore backup failed', error as Error);
      return { success: false, error: (error as any).message };
    }
  });
}

/**
 * Setup IPC handlers for dashboard
 */
function setupDashboardHandlers(): void {
  ipcMain.handle(IPC_CHANNELS['SYSTEM:HEALTH'], async () => {
    try {
      const stats = await DashboardService.getDashboardStats();
      return { success: true, data: stats };
    } catch (error) {
      logger.error('Get health failed', error as Error);
      return { success: false, error: (error as any).message };
    }
  });
}

/**
 * Setup all IPC handlers
 */
function setupIpcHandlers(): void {
  setupAuthHandlers();
  setupParkingHandlers();
  setupTicketHandlers();
  setupReceiptHandlers();
  setupReportHandlers();
  setupBackupHandlers();
  setupDashboardHandlers();
  logger.info('IPC handlers configured');
}

/**
 * Verify COM port available (checking if process already running)
 */
function checkPortAvailable(): boolean {
  // Simplified check - in production, use a proper port-checking library
  return true;
}

// App event handlers
app.on('ready', async () => {
  logger.info('Electron app ready');

  try {
    // Start Express server
    expressServer = new ExpressServer(3000);
    await expressServer.start();

    // Create window
    createWindow();
    createMenu();

    // Setup IPC
    setupIpcHandlers();

    logger.info('Application startup completed');
  } catch (error) {
    logger.critical('Application startup failed', error as Error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  logger.info('All windows closed');
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.critical('Uncaught exception', error);
});

process.on('unhandledRejection', (reason) => {
  logger.critical('Unhandled rejection', new Error(String(reason)));
});

export default app;
