import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStorageEntity } from '../lib/storage';
import type { HistoryEntry } from '../types';

const HISTORY_KEY = 'history' as const;

let $id = 0;
const uid = (prefix: string) => { $id++; return `${prefix}-${Date.now()}-${$id}`; };

export function useHistory() {
  return useQuery({
    queryKey: [HISTORY_KEY],
    queryFn: () => import('../lib/storage').then(m => m.getStorage().history),
  });
}

export function useLogAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, entity, detail }: { type: string; entity: string; detail: string }) => {
      const entry: HistoryEntry = { id: uid('log'), type, entity, detail, date: new Date().toISOString() };
      updateStorageEntity(HISTORY_KEY, h => [entry, ...h].slice(0, 200));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [HISTORY_KEY] }),
  });
}

export function useClearHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => { updateStorageEntity(HISTORY_KEY, () => []); },
    onSuccess: () => qc.invalidateQueries({ queryKey: [HISTORY_KEY] }),
  });
}

export function useRestoreHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entries: HistoryEntry[]) => { updateStorageEntity(HISTORY_KEY, () => entries.slice(0, 200)); },
    onSuccess: () => qc.invalidateQueries({ queryKey: [HISTORY_KEY] }),
  });
}
