import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import env from '../../config/env.js';
import prisma from '../../config/prisma.js';
import { conflict, unauthorized, forbidden } from '../../utils/errors.js';

class AuthService {
  /**
   * Helper to hash refresh token for safe storage and lookups.
   */
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates Access and Refresh tokens for a given user and stores the refresh token hash.
   */
  async generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      jti: crypto.randomUUID()
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN
    });

    const tokenHash = this.hashToken(refreshToken);
    // 7 days expiration from now
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });

    return { accessToken, refreshToken };
  }

  /**
   * Strips sensitive password fields from user object.
   */
  sanitizeUser(user) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Register a new Student or Counselor in one database transaction.
   */
  async register(data) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (existing) {
      throw conflict('An account with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          status: 'ACTIVE'
        }
      });

      if (data.role === 'STUDENT') {
        const student = await tx.student.create({
          data: {
            userId: createdUser.id,
            bacTrack: data.bacTrack || null,
            bacYear: data.bacYear || null,
            region: data.region || null,
            stage: data.stage || 'PRE_BAC',
            preferences: {}
          }
        });
        return { ...createdUser, student, counselor: null };
      } else if (data.role === 'COUNSELOR') {
        const counselor = await tx.counselor.create({
          data: {
            userId: createdUser.id,
            specialties: data.specialties || [],
            bio: data.bio || null
          }
        });
        return { ...createdUser, student: null, counselor };
      }

      return createdUser;
    });

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens
    };
  }

  /**
   * Login with email and password.
   */
  async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        student: true,
        counselor: true
      }
    });

    if (!user) {
      throw unauthorized('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw unauthorized('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw forbidden('Your account has been suspended or is inactive');
    }

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens
    };
  }

  /**
   * Rotate refresh token: revokes old token and issues a new pair.
   */
  async refresh(refreshToken) {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw unauthorized('Invalid or expired refresh token');
    }

    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { student: true, counselor: true } } }
    });

    if (!storedToken) {
      throw unauthorized('Refresh token not found');
    }

    if (storedToken.revokedAt) {
      // Possible token reuse attack: revoke all tokens for this user
      await prisma.refreshToken.updateMany({
        where: { userId: decoded.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });
      throw unauthorized('Refresh token was already revoked. Please log in again.');
    }

    if (storedToken.expiresAt < new Date()) {
      throw unauthorized('Refresh token has expired');
    }

    // Revoke current token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() }
    });

    if (storedToken.user.status !== 'ACTIVE') {
      throw forbidden('Account is inactive');
    }

    // Issue new pair
    return this.generateTokens(storedToken.user);
  }

  /**
   * Revoke a refresh token on logout.
   */
  async logout(refreshToken) {
    if (!refreshToken) return;
    const tokenHash = this.hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  /**
   * Get user profile by userId.
   */
  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        counselor: true
      }
    });

    if (!user) {
      throw unauthorized('User not found');
    }

    return this.sanitizeUser(user);
  }
}

export default new AuthService();
