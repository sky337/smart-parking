// Express middleware

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Logger from '@shared/utils/logger';
import { AuthenticationError, AuthorizationError } from '@shared/utils/errors';
import { User } from '@shared/types/index';

const logger = new Logger('Middleware');

declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

/**
 * CORS middleware
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
}

/**
 * Error handling middleware
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Request error', error, { path: req.path, method: req.method });

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    code,
    message,
    data: error.data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
}

/**
 * Authentication middleware
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    throw new AuthenticationError('No authentication token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as User;
    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    logger.warn('Invalid token', { error: (error as Error).message });
    throw new AuthenticationError('Invalid or expired token');
  }
}

/**
 * Authorization middleware - check user role
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError(`Role '${req.user.role}' is not authorized for this action`);
    }

    next();
  };
}

/**
 * Validation middleware wrapper
 */
export function validateRequest(validator: (req: Request) => { valid: boolean; errors: Record<string, string> }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = validator(req);

    if (!result.valid) {
      const errorMessage = Object.values(result.errors).join(', ');
      throw new Error(`Validation error: ${errorMessage}`);
    }

    next();
  };
}

/**
 * Async error handler wrapper
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Request rate limiter (simple in-memory)
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number = 60000; // 1 minute
  private maxRequests: number = 100;

  public isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];

    // Filter out old requests outside the window
    const filteredRequests = requests.filter((time) => now - time < this.windowMs);

    if (filteredRequests.length >= this.maxRequests) {
      return false;
    }

    filteredRequests.push(now);
    this.requests.set(identifier, filteredRequests);

    return true;
  }
}

const rateLimiter = new RateLimiter();

/**
 * Rate limiting middleware
 */
export function rateLimit(windowMs?: number, maxRequests?: number) {
  const limiter = new RateLimiter();
  if (windowMs) limiter['windowMs'] = windowMs;
  if (maxRequests) limiter['maxRequests'] = maxRequests;

  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.ip || 'unknown';

    if (!limiter.isAllowed(identifier)) {
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
      });
    } else {
      next();
    }
  };
}
