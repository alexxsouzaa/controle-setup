import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fsList, fsCreate, fsRemoveMany, fsClearAll, fsReplaceAll } from '../lib/api/firestore';
import { uid } from '../lib/api/client';
import type { HistoryEntry } from '../types';

const HISTORY_KEY = 'history' as const;
const HISTORY_COLLECTION = 'history' as const;
const MAX_HISTORY = 200;

export function useHistory() {
  return useQuery({
    queryKey: [HISTORY_KEY],
    queryFn: async () => {
      const entries = await fsList<HistoryEntry>(HISTORY_COLLECTION);
      return entries.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    },
  });
}

export function useLogAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, entity, detail }: { type: string; entity: string; detail: string }) => {
      const entry: HistoryEntry = { id: uid('log'), type, entity, detail, date: new Date().toISOString() };
      await fsCreate<HistoryEntry>(HISTORY_COLLECTION, entry);
      const all = await fsList<HistoryEntry>(HISTORY_COLLECTION);
      if (all.length > MAX_HISTORY) {
        const stale = all
          .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
          .slice(0, all.length - MAX_HISTORY)
          .map((h) => h.id);
        await fsRemoveMany(HISTORY_COLLECTION, stale);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [HISTORY_KEY] }),
  });
}

export function useClearHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => fsClearAll([HISTORY_COLLECTION]),
    onSuccess: () => qc.invalidateQueries({ queryKey: [HISTORY_KEY] }),
  });
}

export function useRestoreHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entries: HistoryEntry[]) => fsReplaceAll(HISTORY_COLLECTION, entries.slice(0, MAX_HISTORY)),
    onSuccess: () => qc.invalidateQueries({ queryKey: [HISTORY_KEY] }),
  });
}
