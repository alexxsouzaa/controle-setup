import { z } from 'zod';

export const pieceSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  specification: z.string().optional(),
  compat: z.string().min(1, 'Compatibilidade é obrigatória'),
  compatibleMachineIds: z.array(z.string()).optional(),
  location: z.string().min(1, 'Localização é obrigatória'),
  stock: z.number().min(0, 'Estoque não pode ser negativo'),
  min: z.number().min(0, 'Mínimo não pode ser negativo'),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
  sealingType: z.string().optional(),
  diameterMin: z.number().min(0).optional(),
  diameterMax: z.number().min(0).optional(),
});
