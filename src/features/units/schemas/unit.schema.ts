import { z } from 'zod';

export const unitSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório.'),
  status: z.enum(['active', 'inactive']).default('active'),
  description: z.string().trim().optional(),
});

export type UnitFormData = z.infer<typeof unitSchema>;
