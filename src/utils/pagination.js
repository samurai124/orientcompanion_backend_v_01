/**
 * Extracts and validates pagination parameters from query string.
 * @param {object} query - Express request query object
 * @param {number} defaultLimit - Default limit per page
 * @param {number} maxLimit - Maximum allowed limit
 * @returns {{ page: number, limit: number, skip: number, take: number }}
 */
export const getPaginationParams = (query = {}, defaultLimit = 10, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const rawLimit = parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.max(1, Math.min(rawLimit, maxLimit));
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    take: limit
  };
};

/**
 * Formats data and total count into standard paginated structure.
 */
export const formatPaginatedResponse = (items, total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};
