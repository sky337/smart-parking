// Preload script - securely expose APIs to renderer

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/index';

/**
 * Expose safe APIs to renderer process
 */
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    // Auth
    login: (credentials: any) => ipcRenderer.invoke(IPC_CHANNELS['AUTH:LOGIN'], credentials),
    verifyToken: (token: string) => ipcRenderer.invoke(IPC_CHANNELS['AUTH:VERIFY'], token),
    refreshToken: (token: string) => ipcRenderer.invoke(IPC_CHANNELS['AUTH:REFRESH'], token),

    // Parking
    getParkingLots: () => ipcRenderer.invoke(IPC_CHANNELS['PARKING:GET_LOTS']),
    createParkingLot: (data: any) => ipcRenderer.invoke(IPC_CHANNELS['PARKING:CREATE_LOT'], data),

    // Slots
    getSlots: (lotId: string, status?: string, zone?: string) =>
      ipcRenderer.invoke(IPC_CHANNELS['SLOTS:GET_SLOTS'], lotId, status, zone),
    getSlotAvailability: (lotId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS['SLOTS:GET_AVAILABILITY'], lotId),

    // Tickets
    createTicket: (data: any) => ipcRenderer.invoke(IPC_CHANNELS['TICKETS:CREATE'], data),
    exitTicket: (ticketId: string, operatorId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS['TICKETS:EXIT'], ticketId, operatorId),
    getTicket: (ticketId: string) => ipcRenderer.invoke(IPC_CHANNELS['TICKETS:GET'], ticketId),
    searchTickets: (filters: any) => ipcRenderer.invoke(IPC_CHANNELS['TICKETS:SEARCH'], filters),

    // Receipts
    generateReceipt: (ticketId: string, chargeId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS['RECEIPTS:GENERATE'], ticketId, chargeId),
    printReceipt: (receiptId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS['RECEIPTS:PRINT'], receiptId),

    // Reports
    generateReport: (reportType: string, params: any) =>
      ipcRenderer.invoke(IPC_CHANNELS['REPORTS:GENERATE'], reportType, params),
    exportReport: (reportType: string, format: string) =>
      ipcRenderer.invoke(IPC_CHANNELS['REPORTS:EXPORT'], reportType, format),

    // Backup
    createBackup: (userId: string) => ipcRenderer.invoke(IPC_CHANNELS['BACKUP:CREATE'], userId),
    listBackups: () => ipcRenderer.invoke(IPC_CHANNELS['BACKUP:LIST']),
    restoreBackup: (backupId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS['BACKUP:RESTORE'], backupId),

    // System
    getSystemHealth: () => ipcRenderer.invoke(IPC_CHANNELS['SYSTEM:HEALTH']),

    // Event listeners
    on: (channel: string, listener: any) => {
      const validChannels = Object.values(IPC_CHANNELS);
      if (validChannels.includes(channel as any)) {
        ipcRenderer.on(channel, (event, ...args) => listener(...args));
      }
    },
    off: (channel: string, listener: any) => {
      const validChannels = Object.values(IPC_CHANNELS);
      if (validChannels.includes(channel as any)) {
        ipcRenderer.off(channel, listener);
      }
    },
    once: (channel: string, listener: any) => {
      const validChannels = Object.values(IPC_CHANNELS);
      if (validChannels.includes(channel as any)) {
        ipcRenderer.once(channel, (event, ...args) => listener(...args));
      }
    },
  },
});

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        [key: string]: any;
      };
    };
  }
}
