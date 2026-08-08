import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flowsApi } from '../lib/api';
import type { Flow } from '../types';

const FLOWS_KEY = 'flows' as const;

export function useFlows() {
  return useQuery({
    queryKey: [FLOWS_KEY],
    queryFn: () => flowsApi.list(),
  });
}

export function useAddFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (f: Partial<Flow> & { name: string }) => flowsApi.create(f),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

export function useUpdateFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Flow> }) => flowsApi.update(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

export function useDuplicateFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => flowsApi.duplicate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

export function useDeleteFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => flowsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

export function useDeleteFlows() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => flowsApi.removeMany(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}
