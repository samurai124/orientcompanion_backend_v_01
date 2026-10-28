import { z } from 'zod';

export const createSchoolSchema = z.object({
  name: z.string().min(2),
  acronym: z.string().min(2),
  type: z.string().min(2),
  city: z.string().min(2),
  region: z.string().min(2),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().optional()
});

export const updateSchoolSchema = createSchoolSchema.partial();

export const createFiliereSchema = z.object({
  schoolId: z.coerce.number().int().positive(),
  name: z.string().min(2),
  description: z.string().optional(),
  level: z.string().min(2), // BAC+2, BAC+3, BAC+5
  requiredBacTracks: z.array(z.string()).min(1),
  riasecProfile: z.object({
    R: z.number().min(0).max(100),
    I: z.number().min(0).max(100),
    A: z.number().min(0).max(100),
    S: z.number().min(0).max(100),
    E: z.number().min(0).max(100),
    C: z.number().min(0).max(100)
  }),
  tags: z.array(z.string()).default([]),
  embedding: z.array(z.number()).optional()
});

export const updateFiliereSchema = createFiliereSchema.partial();

export const createRequirementSchema = z.object({
  filiereId: z.coerce.number().int().positive(),
  year: z.coerce.number().int().min(2020).max(2050),
  minAverage: z.coerce.number().min(0).max(20),
  selectionMode: z.enum(['DOSSIER', 'CONCOURS', 'MIXED']).default('DOSSIER'),
  subjectWeights: z.record(z.number().min(0)),
  minSubjectGrades: z.record(z.number().min(0).max(20)).optional().default({}),
  sourceUrl: z.string().url().optional().or(z.literal(''))
});

export const updateRequirementSchema = createRequirementSchema.partial();

export const createCutoffSchema = z.object({
  filiereId: z.coerce.number().int().positive(),
  year: z.coerce.number().int().min(2015).max(2050),
  cutoffScore: z.coerce.number().min(0).max(20),
  source: z.string().optional().default('SAMPLE DATA')
});

export const updateCutoffSchema = createCutoffSchema.partial();

export const createDocumentSchema = z.object({
  schoolId: z.coerce.number().int().positive(),
  name: z.string().min(2),
  description: z.string().optional(),
  isMandatory: z.boolean().default(true),
  howToObtain: z.string().optional(),
  order: z.coerce.number().int().default(0)
});

export const updateDocumentSchema = createDocumentSchema.partial();

export const createProcessSchema = z.object({
  schoolId: z.coerce.number().int().positive(),
  year: z.coerce.number().int().min(2020).max(2050),
  openDate: z.coerce.date(),
  closeDate: z.coerce.date(),
  concoursDate: z.coerce.date().optional(),
  steps: z.array(z.object({
    stepNumber: z.number(),
    title: z.string(),
    description: z.string(),
    date: z.string().optional()
  })),
  officialLink: z.string().url().optional().or(z.literal(''))
});

export const updateProcessSchema = createProcessSchema.partial();

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED'])
});

export const listUsersQuerySchema = z.object({
  role: z.enum(['STUDENT', 'COUNSELOR', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10)
});

export const entityIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer')
});
