import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { piecesApi } from '../lib/api';
import type { Piece } from '../types';

const PIECES_KEY = 'pieces' as const;

export function usePieces() {
  return useQuery({
    queryKey: [PIECES_KEY],
    queryFn: () => piecesApi.list(),
  });
}

export function useAddPiece() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<Piece> & { name: string; category: string }) => piecesApi.create(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PIECES_KEY] }),
  });
}

export function useUpdatePiece() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Piece> }) => piecesApi.update(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PIECES_KEY] }),
  });
}

export function useDeletePiece() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => piecesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PIECES_KEY] }),
  });
}

export function useDeletePieces() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => piecesApi.removeMany(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PIECES_KEY] }),
  });
}
