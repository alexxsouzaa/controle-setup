import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configApi } from '../lib/api';
import type { Config } from '../types';

const CONFIG_KEY = 'config' as const;

export function useConfig() {
  return useQuery({
    queryKey: [CONFIG_KEY],
    queryFn: () => configApi.get(),
  });
}

export function useUpdateConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<Config>) => configApi.update(updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONFIG_KEY] }),
  });
}
