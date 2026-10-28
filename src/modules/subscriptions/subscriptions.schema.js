import { z } from 'zod';

export const checkoutSchema = z.object({
  planCode: z.enum(['FREE', 'PREMIUM'], {
    errorMap: () => ({ message: "Plan code must be either 'FREE' or 'PREMIUM'" })
  })
});
