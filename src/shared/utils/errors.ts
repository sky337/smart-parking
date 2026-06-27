// Error handling utilities

import { ERROR_CODES } from '../constants/index';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly data?: Record<string, any>;

  constructor(
    message: string,
    code: string = ERROR_CODES.INTERNAL_ERROR,
    statusCode: number = 500,
    data?: Record<string, any>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.data = data;
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, data?: Record<string, any>) {
    super(message, ERROR_CODES.VALIDATION_ERROR, 400, data);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, ERROR_CODES.UNAUTHORIZED, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, ERROR_CODES.FORBIDDEN, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, ERROR_CODES.NOT_FOUND, 404);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', originalError?: Error) {
    super(message, ERROR_CODES.DATABASE_ERROR, 500, {
      originalError: originalError?.message,
    });
    this.name = 'DatabaseError';
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, code: string = ERROR_CODES.INTERNAL_ERROR, data?: Record<string, any>) {
    super(message, code, 400, data);
    this.name = 'BusinessLogicError';
  }
}

export interface ErrorResponse {
  success: false;
  code: string;
  message: string;
  statusCode: number;
  data?: Record<string, any>;
  timestamp: string;
}

export function createErrorResponse(error: AppError | Error): ErrorResponse {
  if (error instanceof AppError) {
    return {
      success: false,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      data: error.data,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: false,
    code: ERROR_CODES.INTERNAL_ERROR,
    message: error.message || 'An unexpected error occurred',
    statusCode: 500,
    timestamp: new Date().toISOString(),
  };
}

export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}
