import { forbidden, unauthorized } from '../utils/errors.js';

/**
 * Middleware factory to restrict route access by role.
 * Example: authorize('STUDENT'), authorize('ADMIN', 'COUNSELOR')
 * 
 * @param  {...string} allowedRoles 
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(unauthorized('Authentication required before checking roles'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        forbidden(
          `Access forbidden: requires one of [${allowedRoles.join(', ')}] role(s)`,
          { userRole: req.user.role, requiredRoles: allowedRoles }
        )
      );
    }

    return next();
  };
};

export default authorize;
