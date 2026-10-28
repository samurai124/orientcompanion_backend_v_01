/**
 * Send a standardized success response.
 * Format: { success: true, data: ..., error: null }
 */
export const sendSuccess = (res, data = null, status = 200) => {
  return res.status(status).json({
    success: true,
    data: data !== undefined ? data : null,
    error: null
  });
};

/**
 * Send a standardized error response.
 * Format: { success: false, data: null, error: { code, message, details } }
 */
export const sendError = (res, status = 500, code = 'INTERNAL_ERROR', message = 'An error occurred', details = null) => {
  return res.status(status).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      details
    }
  });
};
