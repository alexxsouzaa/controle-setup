import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStorageEntity, getStorage } from '../lib/storage';
import type { Piece } from '../types';

const PIECES_KEY = 'pieces' as const;

let $id = 0;
const nowISO = () => new Date().toISOString().slice(0, 10);
const uid = (prefix: string) => { $id++; return `${prefix}-${Date.now()}-${$id}`; };

function resolveCompat(ids: string[] = []): string {
  const machines = getStorage().machines;
  return ids.map(id => { const m = machines.find(mch => mch.id === id); return m?.name || ''; }).filter(Boolean).join(', ');
}

export function usePieces() {
  return useQuery({
    queryKey: [PIECES_KEY],
    queryFn: () => getStorage().pieces,
  });
}

export function useAddPiece() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<Piece> & { name: string; category: string }) => {
      const compatibleMachineIds = p.compatibleMachineIds || [];
      const compat = resolveCompat(compatibleMachineIds);
      const newPiece: Piece = {
        ...p,
        id: p.id || uid('pc'),
        code: p.code ?? '',
        stock: p.stock ?? 0,
        min: p.min ?? 0,
        unit: p.unit ?? '',
        location: p.location ?? '',
        compat,
        compatibleMachineIds,
      };
      updateStorageEntity(PIECES_KEY, pieces => [...pieces, newPiece]);
      return newPiece;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [PIECES_KEY] }),
  });
}

export function useUpdatePiece() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Piece> }) => {
      updateStorageEntity(PIECES_KEY, pieces => pieces.map(p => {
        if (p.id !== id) return p;
        const merged = { ...p, ...updates };
        if (updates.compatibleMachineIds) {
          merged.compat = resolveCompat(merged.compatibleMachineIds);
        }
        return merged as Piece;
      }));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [PIECES_KEY] }),
  });
}

export function useDeletePiece() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { updateStorageEntity(PIECES_KEY, pieces => pieces.filter(p => p.id !== id)); },
    onSuccess: () => qc.invalidateQueries({ queryKey: [PIECES_KEY] }),
  });
}

export function useDeletePieces() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => { const set = new Set(ids); updateStorageEntity(PIECES_KEY, pieces => pieces.filter(p => !set.has(p.id))); },
    onSuccess: () => qc.invalidateQueries({ queryKey: [PIECES_KEY] }),
  });
}
