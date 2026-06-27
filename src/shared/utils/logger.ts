// Logger utility - comprehensive logging system

import { LOG_LEVELS } from '../constants/index';
import * as fs from 'fs';
import * as path from 'path';

interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  message: string;
  data?: Record<string, any>;
  stack?: string;
}

class Logger {
  private service: string;
  private logDir: string;
  private isDev: boolean;

  constructor(service: string, logDir?: string) {
    this.service = service;
    this.logDir = logDir || path.join(process.cwd(), 'logs');
    this.isDev = process.env.NODE_ENV === 'development';
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private buildLogEntry(
    level: string,
    message: string,
    data?: Record<string, any>,
    stack?: string
  ): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      service: this.service,
      message,
      ...(data && { data }),
      ...(stack && { stack }),
    };
  }

  private writeLog(entry: LogEntry): void {
    const logFile = path.join(this.logDir, `${this.service}-${this.getDateString()}.log`);
    const logLine = `${JSON.stringify(entry)}\n`;

    try {
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  private getDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
  }

  private log(
    level: string,
    message: string,
    data?: Record<string, any>,
    stack?: string
  ): void {
    const entry = this.buildLogEntry(level, message, data, stack);
    this.writeLog(entry);

    if (this.isDev) {
      const color = this.getLogColor(level);
      console.log(`${color}[${entry.timestamp}] [${entry.service}] [${level}] ${message}`, data || '');
    }
  }

  private getLogColor(level: string): string {
    const colors: Record<string, string> = {
      [LOG_LEVELS.DEBUG]: '\x1b[36m', // Cyan
      [LOG_LEVELS.INFO]: '\x1b[32m', // Green
      [LOG_LEVELS.WARN]: '\x1b[33m', // Yellow
      [LOG_LEVELS.ERROR]: '\x1b[31m', // Red
      [LOG_LEVELS.CRITICAL]: '\x1b[35m', // Magenta
    };
    return colors[level] || '\x1b[0m';
  }

  public debug(message: string, data?: Record<string, any>): void {
    this.log(LOG_LEVELS.DEBUG, message, data);
  }

  public info(message: string, data?: Record<string, any>): void {
    this.log(LOG_LEVELS.INFO, message, data);
  }

  public warn(message: string, data?: Record<string, any>): void {
    this.log(LOG_LEVELS.WARN, message, data);
  }

  public error(message: string, error?: Error | Record<string, any>, data?: Record<string, any>): void {
    let stack: string | undefined;
    let errorData = error;

    if (error instanceof Error) {
      stack = error.stack;
      errorData = { message: error.message, name: error.name };
    }

    this.log(LOG_LEVELS.ERROR, message, { ...errorData, ...data }, stack);
  }

  public critical(message: string, error?: Error | Record<string, any>, data?: Record<string, any>): void {
    let stack: string | undefined;
    let errorData = error;

    if (error instanceof Error) {
      stack = error.stack;
      errorData = { message: error.message, name: error.name };
    }

    this.log(LOG_LEVELS.CRITICAL, message, { ...errorData, ...data }, stack);
  }
}

export default Logger;
