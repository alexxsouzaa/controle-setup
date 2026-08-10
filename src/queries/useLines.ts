import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { linesApi } from '../lib/api';
import type { Line } from '../types';

const LINES_KEY = 'lines' as const;

export function useLines() {
  return useQuery({
    queryKey: [LINES_KEY],
    queryFn: () => linesApi.list(),
  });
}

export function useAddLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (l: Partial<Line> & { name: string; unitId: string }) => linesApi.create(l),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LINES_KEY] }),
  });
}

export function useUpdateLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Line> }) => linesApi.update(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LINES_KEY] }),
  });
}

export function useDeleteLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => linesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LINES_KEY] }),
  });
}

export function useDeleteLines() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => linesApi.removeMany(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LINES_KEY] }),
  });
}
