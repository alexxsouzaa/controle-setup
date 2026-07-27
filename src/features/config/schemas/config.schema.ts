import { z } from 'zod';

export const uoConfigSchema = z.object({
  ferramentais: z.array(z.string()).optional(),
  tiposFormato: z.array(z.string()).optional(),
  categorias: z.array(z.string()).optional(),
  linhas: z.array(z.string()).optional(),
  toolingCategories: z.array(z.string()).optional(),
  formatTypes: z.array(z.string()).optional(),
  productCategories: z.array(z.string()).optional(),
  lines: z.array(z.string()).optional(),
});

export const configSchema = z.object({
  uoConfigs: z.record(z.string(), uoConfigSchema).optional(),
}).passthrough();
