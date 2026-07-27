import { z } from 'zod';

export const setupFlowSchema = z.object({
  machineId: z.string().min(1, 'Máquina é obrigatória'),
  productId: z.string().min(1, 'Produto é obrigatório'),
  formatId: z.string().optional(),
  primaryPieces: z.array(z.string()).optional(),
  alternativePieces: z.array(z.string()).optional(),
});
