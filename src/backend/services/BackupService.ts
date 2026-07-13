// Database Backup and Restore Service

import prisma from '@backend/utils/database';
import Logger from '@shared/utils/logger';
import { NotFoundError, BusinessLogicError } from '@shared/utils/errors';
import * as fs from 'fs';
import * as path from 'path';
import * as sqlite3 from 'better-sqlite3';

const logger = new Logger('BackupService');

export class BackupService {
  private static backupDir = path.join(process.cwd(), 'backups');

  /**
   * Create database backup
   */
  static async createBackup(createdBy: string): Promise<any> {
    logger.info('Creating database backup', { createdBy });

    try {
      this.ensureBackupDir();

      const backupName = `parking_backup_${Date.now()}`;
      const backupPath = path.join(BackupService.backupDir, `${backupName}.db`);
      const sourceDb = path.join(process.cwd(), 'prisma', 'parking.db');

      // Copy database file
      if (!fs.existsSync(sourceDb)) {
        throw new BusinessLogicError('Source database not found');
      }

      fs.copyFileSync(sourceDb, backupPath);

      const stats = fs.statSync(backupPath);

      // Create backup record
      const backup = await prisma.databaseBackup.create({
        data: {
          backupName,
          backupPath,
          backupSize: stats.size,
          createdBy,
          status: 'COMPLETED',
        },
      });

      logger.info('Backup created successfully', {
        backupId: backup.id,
        size: stats.size,
      });

      return backup;
    } catch (error) {
      logger.error('Backup creation failed', error as Error);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  static async restoreBackup(backupId: string, restoredBy: string): Promise<any> {
    logger.info('Restoring database from backup', { backupId });

    try {
      const backup = await prisma.databaseBackup.findUnique({
        where: { id: backupId },
      });

      if (!backup) {
        throw new NotFoundError('Backup not found');
      }

      if (!fs.existsSync(backup.backupPath)) {
        throw new BusinessLogicError('Backup file not found');
      }

      const targetDb = path.join(process.cwd(), 'prisma', 'parking.db');

      // Disconnect Prisma before replacing database
      await prisma.$disconnect();

      // Create safety backup of current database
      if (fs.existsSync(targetDb)) {
        const safetyBackup = `${targetDb}.pre_restore_${Date.now()}`;
        fs.copyFileSync(targetDb, safetyBackup);
        logger.info('Safety backup created', { path: safetyBackup });
      }

      // Restore database
      fs.copyFileSync(backup.backupPath, targetDb);

      // Update backup record
      const updated = await prisma.databaseBackup.update({
        where: { id: backupId },
        data: { restoredAt: new Date() },
      });

      logger.info('Database restored successfully', { backupId });

      return updated;
    } catch (error) {
      logger.error('Database restore failed', error as Error);
      throw error;
    }
  }

  /**
   * List all backups
   */
  static async listBackups(): Promise<any[]> {
    const backups = await prisma.databaseBackup.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return backups.map((backup) => ({
      ...backup,
      exists: fs.existsSync(backup.backupPath),
    }));
  }

  /**
   * Delete backup
   */
  static async deleteBackup(backupId: string): Promise<void> {
    logger.info('Deleting backup', { backupId });

    const backup = await prisma.databaseBackup.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      throw new NotFoundError('Backup not found');
    }

    // Delete file
    if (fs.existsSync(backup.backupPath)) {
      fs.unlinkSync(backup.backupPath);
      logger.info('Backup file deleted', { path: backup.backupPath });
    }

    // Delete record
    await prisma.databaseBackup.delete({
      where: { id: backupId },
    });

    logger.info('Backup record deleted', { backupId });
  }

  /**
   * Get backup statistics
   */
  static async getBackupStats(): Promise<any> {
    const backups = await this.listBackups();

    const totalSize = backups.reduce((sum, backup) => sum + backup.backupSize, 0);
    const existingBackups = backups.filter((b) => b.exists);

    return {
      totalBackups: backups.length,
      existingBackups: existingBackups.length,
      missingBackups: backups.length - existingBackups.length,
      totalSize,
      lastBackup: backups[0] || null,
      oldestBackup: backups[backups.length - 1] || null,
    };
  }

  /**
   * Verify backup integrity
   */
  static async verifyBackup(backupId: string): Promise<boolean> {
    logger.info('Verifying backup', { backupId });

    try {
      const backup = await prisma.databaseBackup.findUnique({
        where: { id: backupId },
      });

      if (!backup || !fs.existsSync(backup.backupPath)) {
        return false;
      }

      // Try to open the backup file as SQLite
      const backupDb = new (require('better-sqlite3'))(backup.backupPath, {
        readonly: true,
      });

      // Run simple integrity check
      const result = backupDb.prepare('PRAGMA integrity_check').get() as any;
      backupDb.close();

      const isValid = result.integrity_check === 'ok';

      if (isValid) {
        await prisma.databaseBackup.update({
          where: { id: backupId },
          data: { status: 'VERIFIED' },
        });
      }

      logger.info('Backup verification complete', { backupId, valid: isValid });

      return isValid;
    } catch (error) {
      logger.error('Backup verification failed', error as Error);
      return false;
    }
  }

  /**
   * Clean up old backups (retention policy)
   */
  static async cleanupOldBackups(retentionDays: number = 30): Promise<number> {
    logger.info('Cleaning up old backups', { retentionDays });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldBackups = await prisma.databaseBackup.findMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    let deletedCount = 0;

    for (const backup of oldBackups) {
      try {
        await this.deleteBackup(backup.id);
        deletedCount++;
      } catch (error) {
        logger.warn('Failed to delete old backup', error as Error, {
          backupId: backup.id,
        });
      }
    }

    logger.info('Cleanup complete', { deletedCount });

    return deletedCount;
  }

  /**
   * Ensure backup directory exists
   */
  private static ensureBackupDir(): void {
    if (!fs.existsSync(BackupService.backupDir)) {
      fs.mkdirSync(BackupService.backupDir, { recursive: true });
    }
  }
}
