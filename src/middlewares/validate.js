import { AppError } from '../utils/errors.js';

/**
 * Express middleware factory to validate incoming request data using Zod schemas.
 * 
 * @param {object} schemas
 * @param {import('zod').ZodSchema} [schemas.body]
 * @param {import('zod').ZodSchema} [schemas.params]
 * @param {import('zod').ZodSchema} [schemas.query]
 */
export const validate = ({ body, params, query } = {}) => {
  return (req, res, next) => {
    const errorDetails = {};

    if (body) {
      const result = body.safeParse(req.body);
      if (!result.success) {
        errorDetails.body = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
      } else {
        req.body = result.data;
      }
    }

    if (params) {
      const result = params.safeParse(req.params);
      if (!result.success) {
        errorDetails.params = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
      } else {
        req.params = result.data;
      }
    }

    if (query) {
      const result = query.safeParse(req.query);
      if (!result.success) {
        errorDetails.query = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
      } else {
        req.query = result.data;
      }
    }

    if (Object.keys(errorDetails).length > 0) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Validation failed', errorDetails));
    }

    return next();
  };
};

export default validate;
