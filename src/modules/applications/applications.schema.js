import { z } from 'zod';

export const createApplicationSchema = z.object({
  filiereId: z.coerce.number().int().positive('Filiere ID must be a positive integer')
});

export const updateChecklistItemSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  notes: z.string().max(1000).optional()
});

export const applicationIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Application ID must be a positive integer')
});

export const checklistItemParamSchema = z.object({
  id: z.coerce.number().int().positive('Application ID must be a positive integer'),
  itemId: z.coerce.number().int().positive('Checklist Item ID must be a positive integer')
});
