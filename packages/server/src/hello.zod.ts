import { z } from 'zod';

export const GeneralMessage = z.object({
  message: z.string(),
});

export const Person = z.object({
  name: z.string().min(1),
});
