import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStorageEntity, getStorage } from '../lib/storage';
import type { Config } from '../types';

const CONFIG_KEY = 'config' as const;

export function useConfig() {
  return useQuery({
    queryKey: [CONFIG_KEY],
    queryFn: () => getStorage().config,
  });
}

export function useUpdateConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Config>) => {
      updateStorageEntity(CONFIG_KEY, config => ({ ...config, ...updates }));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONFIG_KEY] }),
  });
}
