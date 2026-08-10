import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unitsApi } from '../lib/api';
import type { Unit } from '../types';

const UNITS_KEY = 'units' as const;

export function useUnits() {
  return useQuery({
    queryKey: [UNITS_KEY],
    queryFn: () => unitsApi.list(),
  });
}

export function useAddUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (u: Partial<Unit> & { code: string; name: string }) => unitsApi.create(u),
    onSuccess: () => qc.invalidateQueries({ queryKey: [UNITS_KEY] }),
  });
}

export function useUpdateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Unit> }) => unitsApi.update(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: [UNITS_KEY] }),
  });
}

export function useDeleteUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unitsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [UNITS_KEY] }),
  });
}

export function useDeleteUnits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => unitsApi.removeMany(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: [UNITS_KEY] }),
  });
}
