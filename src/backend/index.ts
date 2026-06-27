// Express Server Setup

import express, { Express } from 'express';
import cors from 'cors';
import Logger from '@shared/utils/logger';
import { initializeDatabase } from '@backend/utils/database';
import {
  corsMiddleware,
  requestLogger,
  errorHandler,
} from '@backend/middleware/index';
import {
  authRouter,
  parkingRouter,
  ticketRouter,
  receiptRouter,
  reportRouter,
  backupRouter,
  dashboardRouter,
} from '@backend/routes/index';

const logger = new Logger('ExpressServer');

export class ExpressServer {
  private app: Express;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Default middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ limit: '10mb', extended: true }));

    // Custom middleware
    this.app.use(corsMiddleware);
    this.app.use(requestLogger);

    // Serve static files
    this.app.use(express.static('public'));
    this.app.use(express.static('dist/renderer'));

    logger.info('Middleware configured');
  }

  private setupRoutes(): void {
    // API Routes
    this.app.use('/api/auth', authRouter);
    this.app.use('/api/parking', parkingRouter);
    this.app.use('/api/tickets', ticketRouter);
    this.app.use('/api/receipts', receiptRouter);
    this.app.use('/api/reports', reportRouter);
    this.app.use('/api/backups', backupRouter);
    this.app.use('/api/dashboard', dashboardRouter);

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
      });
    });

    // Serve React app
    this.app.get('*', (req, res) => {
      res.sendFile(`${process.cwd()}/dist/renderer/index.html`);
    });

    // Error handling middleware (must be last)
    this.app.use(errorHandler);

    logger.info('Routes configured');
  }

  public async start(): Promise<void> {
    try {
      // Initialize database
      logger.info('Initializing database...');
      await initializeDatabase();
      logger.info('Database initialized successfully');

      // Start listening
      this.app.listen(this.port, () => {
        logger.info(`Express server started on port ${this.port}`);
        console.log(`🚀 Server running at http://localhost:${this.port}`);
      });
    } catch (error) {
      logger.critical('Failed to start server', error as Error);
      process.exit(1);
    }
  }
}

export default ExpressServer;
