import { z } from 'zod';

export const lineSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório.'),
  code: z.string().trim().optional(),
  unitId: z.string().min(1, 'UO é obrigatória.'),
  machineIds: z.array(z.string()).default([]),
  status: z.enum(['active', 'inactive']).default('active'),
  notes: z.string().trim().optional(),
});

export type LineFormData = z.infer<typeof lineSchema>;
