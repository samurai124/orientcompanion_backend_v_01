import { z } from 'zod';

export const createSessionSchema = z.object({
  counselorId: z.coerce.number().int().positive(),
  requestedStart: z.coerce.date(),
  requestedEnd: z.coerce.date(),
  subject: z.string().min(3).max(255)
});

export const completeSessionSchema = z.object({
  report: z.string().min(10, 'Report must contain at least 10 characters').max(2000)
});

export const rateSessionSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5)
});

export const createAvailabilitySlotSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6), // 0: Sunday, 1: Monday, ... 6: Saturday
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM (e.g. 09:00)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM (e.g. 12:00)')
});
