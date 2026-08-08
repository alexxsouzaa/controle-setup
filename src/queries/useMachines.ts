import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { machinesApi } from '../lib/api';
import type { Machine } from '../types';

const MACHINES_KEY = 'machines' as const;

export function useMachines() {
  return useQuery({
    queryKey: [MACHINES_KEY],
    queryFn: () => machinesApi.list(),
  });
}

export function useAddMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (m: Partial<Machine> & { name: string; uo: string }) => machinesApi.create(m),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MACHINES_KEY] }),
  });
}

export function useUpdateMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Machine> }) => machinesApi.update(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MACHINES_KEY] }),
  });
}

export function useDeleteMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => machinesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MACHINES_KEY] }),
  });
}

export function useDeleteMachines() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => machinesApi.removeMany(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MACHINES_KEY] }),
  });
}
