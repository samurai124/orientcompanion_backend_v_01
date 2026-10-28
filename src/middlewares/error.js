import { AppError } from '../utils/errors.js';
import env from '../config/env.js';

/**
 * Centralized Express error-handling middleware.
 */
export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Log error details in development
  if (env.NODE_ENV !== 'test') {
    console.error(`[Error] ${err.name || 'Error'}: ${err.message}`);
    if (env.NODE_ENV === 'development' && err.stack) {
      console.error(err.stack);
    }
  }

  // Handle known AppError
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      data: null,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }

  // Handle Zod validation error
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }
    });
  }

  // Handle Prisma Database Errors
  if (err.code === 'P2002') {
    const target = err.meta?.target || 'field';
    return res.status(409).json({
      success: false,
      data: null,
      error: {
        code: 'CONFLICT',
        message: `Unique constraint violation on ${target}`,
        details: err.meta
      }
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: 'NOT_FOUND',
        message: err.meta?.cause || 'Record not found in database',
        details: err.meta
      }
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Invalid reference to a related record',
        details: err.meta
      }
    });
  }

  // Handle JWT Errors
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
        details: null
      }
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Authentication token is invalid',
        details: null
      }
    });
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    const isSize = err.code === 'LIMIT_FILE_SIZE';
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: isSize ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR',
        message: isSize ? `File exceeds the maximum allowed size of ${env.MAX_FILE_SIZE_MB}MB` : err.message,
        details: null
      }
    });
  }

  // Generic fallback for unhandled 500 errors
  const status = err.statusCode || 500;
  const message = env.NODE_ENV === 'production' && status === 500
    ? 'An unexpected internal server error occurred'
    : err.message || 'Internal server error';

  return res.status(status).json({
    success: false,
    data: null,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      details: env.NODE_ENV === 'development' ? err.stack : null
    }
  });
};

export default errorHandler;
