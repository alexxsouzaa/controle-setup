import { z } from 'zod';

export const flowPartSchema = z.object({
  pieceId: z.string(),
  pieceName: z.string(),
  pieceCode: z.string(),
  pieceCategory: z.string(),
});

export const flowSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  machine: z.string().min(1, 'Máquina é obrigatória'),
  machineId: z.string().optional(),
  line: z.string().optional(),
  product: z.string().min(1, 'Produto é obrigatório'),
  productId: z.string().optional(),
  code: z.string().min(1, 'Código é obrigatório'),
  vol: z.string().optional(),
  date: z.string(),
  ver: z.string().min(1, 'Versão é obrigatória'),
  status: z.string().min(1, 'Status é obrigatório'),
  formatId: z.string().optional(),
  formatName: z.string().optional(),
  parts: z.object({
    primary: z.array(flowPartSchema),
    alternative: z.array(flowPartSchema),
  }).optional(),
  tooling: z.array(z.record(z.string(), z.unknown())).optional(),
});
