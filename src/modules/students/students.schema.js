import { z } from 'zod';

export const updateStudentProfileSchema = z.object({
  bacTrack: z.string().optional(),
  bacYear: z.coerce.number().int().min(2000).max(2050).optional(),
  region: z.string().optional(),
  stage: z.enum(['PRE_BAC', 'POST_BAC', 'CONCOURS_PREP']).optional(),
  preferences: z.record(z.any()).optional()
});

export const gradeItemSchema = z.object({
  subjectCode: z.string().min(1, 'Subject code is required'),
  gradeValue: z.coerce
    .number()
    .min(0, 'Grade must be at least 0')
    .max(20, 'Grade cannot exceed 20'),
  period: z.string().min(1, 'Period is required (e.g. S1, S2, REGIONAL, NATIONAL)')
});

export const bulkUpsertGradesSchema = z.object({
  grades: z.array(gradeItemSchema).min(1, 'At least one grade item is required')
});

export const studentIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Student ID must be a positive integer')
});
