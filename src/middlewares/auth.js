import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import prisma from '../config/prisma.js';
import { unauthorized, forbidden } from '../utils/errors.js';

/**
 * Middleware to authenticate requests using JWT Bearer token.
 * Populates req.user with user and profile data.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(unauthorized('Authentication token is required'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(unauthorized('Bearer token missing'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(unauthorized('Access token has expired', null, 'TOKEN_EXPIRED'));
      }
      return next(unauthorized('Invalid access token', null, 'INVALID_TOKEN'));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        student: true,
        counselor: true
      }
    });

    if (!user) {
      return next(unauthorized('User associated with token no longer exists'));
    }

    if (user.status !== 'ACTIVE') {
      return next(forbidden('Your account has been suspended or is inactive', null, 'ACCOUNT_INACTIVE'));
    }

    // Strip passwordHash before attaching to req
    const { passwordHash, ...sanitizedUser } = user;
    req.user = sanitizedUser;

    return next();
  } catch (error) {
    return next(error);
  }
};

export default authenticate;
