import { z } from 'zod';

export const formatoSchema = z.object({
  name: z.string().optional(),
  formatType: z.string().optional(),
  tipo: z.string().optional(),
  volume: z.number().optional(),
  volMin: z.number().optional(),
  volumeUnit: z.string().optional(),
  productId: z.string().optional(),
  machineId: z.string().optional(),
  partIds: z.array(z.string()).optional(),
  alternativePartIds: z.array(z.string()).optional(),
  notes: z.string().optional(),
});
