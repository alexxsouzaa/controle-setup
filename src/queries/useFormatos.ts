import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatosApi } from '../lib/api';
import type { Formato } from '../types';

const FORMATOS_KEY = 'formatos' as const;

export function useFormatos() {
  return useQuery({
    queryKey: [FORMATOS_KEY],
    queryFn: () => formatosApi.list(),
  });
}

export function useAddFormato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (f: Partial<Formato>) => formatosApi.create(f),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FORMATOS_KEY] }),
  });
}

export function useUpdateFormato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Formato> }) => formatosApi.update(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FORMATOS_KEY] }),
  });
}

export function useDeleteFormato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => formatosApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FORMATOS_KEY] }),
  });
}

export function useDeleteFormatos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => formatosApi.removeMany(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FORMATOS_KEY] }),
  });
}
