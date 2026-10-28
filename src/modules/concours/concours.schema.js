import { z } from 'zod';

export const createConcoursSchema = z.object({
  name: z.string().min(2),
  examDate: z.coerce.date().optional(),
  subjects: z.array(z.string()).min(1),
  description: z.string().optional()
});

export const updateConcoursSchema = createConcoursSchema.partial();

export const createQuestionSchema = z.object({
  concoursId: z.coerce.number().int().positive(),
  subjectCode: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  statement: z.string().min(5),
  options: z.array(z.string()).min(2).max(6),
  correctOption: z.coerce.number().int().min(0).max(5),
  explanation: z.string().optional()
});

export const bulkQuestionsSchema = z.object({
  concoursId: z.coerce.number().int().positive(),
  questions: z.array(
    z.object({
      subjectCode: z.string().min(1),
      topic: z.string().min(1),
      difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
      statement: z.string().min(5),
      options: z.array(z.string()).min(2).max(6),
      correctOption: z.coerce.number().int().min(0).max(5),
      explanation: z.string().optional()
    })
  ).min(1, 'At least one question required')
});

export const createMockExamSchema = z.object({
  concoursId: z.coerce.number().int().positive(),
  title: z.string().min(3),
  durationMinutes: z.coerce.number().int().min(10).max(300),
  questionIds: z.array(z.coerce.number().int().positive()).min(1)
});

export const createStudyPlanSchema = z.object({
  concoursId: z.coerce.number().int().positive(),
  hoursPerWeek: z.coerce.number().int().min(2).max(50),
  examDate: z.coerce.date()
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE'])
});

export const submitExamAttemptSchema = z.object({
  answers: z.record(z.coerce.number().int().min(0)) // { [questionId]: selectedOptionIndex }
});

export const askTutorSchema = z.object({
  questionId: z.coerce.number().int().positive().optional(),
  questionText: z.string().max(1000).optional()
}).refine(data => data.questionId !== undefined || (data.questionText && data.questionText.trim().length > 0), {
  message: 'Either questionId or questionText must be provided'
});

export const listQuestionsQuerySchema = z.object({
  concoursId: z.coerce.number().int().positive().optional(),
  subjectCode: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
});
