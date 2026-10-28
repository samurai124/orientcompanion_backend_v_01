import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['STUDENT', 'COUNSELOR']).default('STUDENT'),

  // Optional Student fields
  bacTrack: z.string().optional(),
  bacYear: z.coerce.number().int().min(2000).max(2050).optional(),
  region: z.string().optional(),
  stage: z.enum(['PRE_BAC', 'POST_BAC', 'CONCOURS_PREP']).optional().default('PRE_BAC'),

  // Optional Counselor fields
  specialties: z.array(z.string()).optional(),
  bio: z.string().max(1000).optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});
