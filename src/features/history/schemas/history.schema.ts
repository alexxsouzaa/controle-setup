import { z } from 'zod';

export const historyEntrySchema = z.object({
  type: z.string().min(1, 'Tipo é obrigatório'),
  entity: z.string().min(1, 'Entidade é obrigatória'),
  detail: z.string().min(1, 'Detalhe é obrigatório'),
  date: z.string(),
});
