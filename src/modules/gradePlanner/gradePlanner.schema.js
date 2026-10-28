import { z } from 'zod';

export const createGoalSchema = z.object({
  filiereId: z.coerce.number().int().positive('Filiere ID must be a positive integer')
});

export const simulateGoalSchema = z.object({
  filiereId: z.coerce.number().int().positive('Filiere ID must be a positive integer'),
  hypotheticalGrades: z.record(
    z.coerce.number().min(0, 'Grade must be at least 0').max(20, 'Grade cannot exceed 20')
  )
});

export const goalIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Goal ID must be a positive integer')
});
