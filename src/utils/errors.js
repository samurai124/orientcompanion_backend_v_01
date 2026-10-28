/**
 * Custom application error with HTTP status code and standardized error code.
 */
export class AppError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const badRequest = (message = 'Bad Request', details = null, code = 'BAD_REQUEST') =>
  new AppError(400, code, message, details);

export const unauthorized = (message = 'Unauthorized', details = null, code = 'UNAUTHORIZED') =>
  new AppError(401, code, message, details);

export const forbidden = (message = 'Forbidden', details = null, code = 'FORBIDDEN') =>
  new AppError(403, code, message, details);

export const notFound = (message = 'Resource not found', details = null, code = 'NOT_FOUND') =>
  new AppError(404, code, message, details);

export const conflict = (message = 'Resource conflict', details = null, code = 'CONFLICT') =>
  new AppError(409, code, message, details);

export const internal = (message = 'Internal server error', details = null, code = 'INTERNAL_ERROR') =>
  new AppError(500, code, message, details);
