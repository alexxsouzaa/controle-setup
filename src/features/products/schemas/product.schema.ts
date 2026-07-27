import { z } from 'zod';

export const productSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  family: z.string().optional(),
  vol: z.number().optional(),
  volume: z.number().optional(),
  unit: z.string().optional(),
  volumeUnit: z.string().optional(),
  packaging: z.string().optional(),
  weight: z.string().optional(),
  photo: z.string().optional(),
  image: z.string().optional(),
  formatType: z.string().optional(),
  notes: z.string().optional(),
});
