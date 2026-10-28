import { z } from 'zod';

export const submitAssessmentSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.coerce.number().int().min(1).max(30),
      score: z.coerce.number().int().min(1).max(5) // 1 (Pas du tout d'accord) à 5 (Tout à fait d'accord)
    })
  ).length(30, 'All 30 questionnaire questions must be answered')
});
