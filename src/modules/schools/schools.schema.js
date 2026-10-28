import { z } from 'zod';

export const listSchoolsQuerySchema = z.object({
  city: z.string().optional(),
  region: z.string().optional(),
  type: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
});

export const schoolIdParamSchema = z.object({
  id: z.coerce.number().int().positive('School ID must be a positive integer')
});

export const listFilieresQuerySchema = z.object({
  schoolId: z.coerce.number().int().positive().optional(),
  city: z.string().optional(),
  bacTrack: z.string().optional(),
  level: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
});

export const filiereIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Filiere ID must be a positive integer')
});
