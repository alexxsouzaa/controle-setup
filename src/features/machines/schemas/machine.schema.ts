import { z } from 'zod';

export const machineSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  uo: z.string().min(1, 'UO é obrigatória'),
  lines: z.array(z.string()).optional(),
  toolingCategories: z.array(z.string()).optional(),
  photo: z.string().optional(),
  image: z.string().optional(),
  notes: z.string().optional(),
});
