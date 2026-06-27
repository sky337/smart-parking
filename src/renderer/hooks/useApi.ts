// Custom hooks for API interactions

import React from 'react';

export function useApi() {
  return {
    // Auth
    login: (username: string, password: string) =>
      window.electron.ipcRenderer.login({ username, password }),

    // Parking
    getParkingLots: () => window.electron.ipcRenderer.getParkingLots(),
    getSlots: (lotId: string) =>
      window.electron.ipcRenderer.getSlots(lotId),
    getSlotAvailability: (lotId: string) =>
      window.electron.ipcRenderer.getSlotAvailability(lotId),

    // Tickets
    createTicket: (data: any) =>
      window.electron.ipcRenderer.createTicket(data),
    exitTicket: (ticketId: string, operatorId: string) =>
      window.electron.ipcRenderer.exitTicket(ticketId, operatorId),
    getTicket: (ticketId: string) =>
      window.electron.ipcRenderer.getTicket(ticketId),
    searchTickets: (filters: any) =>
      window.electron.ipcRenderer.searchTickets(filters),

    // Receipts
    generateReceipt: (ticketId: string, chargeId: string) =>
      window.electron.ipcRenderer.generateReceipt(ticketId, chargeId),
    printReceipt: (receiptId: string) =>
      window.electron.ipcRenderer.printReceipt(receiptId),

    // Reports
    generateReport: (reportType: string, params: any) =>
      window.electron.ipcRenderer.generateReport(reportType, params),
    exportReport: (reportType: string, format: string) =>
      window.electron.ipcRenderer.exportReport(reportType, format),

    // Backup
    createBackup: (userId: string) =>
      window.electron.ipcRenderer.createBackup(userId),
    listBackups: () =>
      window.electron.ipcRenderer.listBackups(),
    restoreBackup: (backupId: string) =>
      window.electron.ipcRenderer.restoreBackup(backupId),

    // System
    getSystemHealth: () =>
      window.electron.ipcRenderer.getSystemHealth(),
  };
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = React.useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [value, setValue] = React.useState<T | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  // The execute function wraps asyncFunction and handles setting state
  const execute = React.useCallback(async () => {
    setStatus('pending');
    setValue(null);
    setError(null);
    try {
      const response = await asyncFunction();
      setValue(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error as Error);
      setStatus('error');
      throw error;
    }
  }, [asyncFunction]);

  // Call execute if we want to fire it right away
  React.useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, value, error };
}
