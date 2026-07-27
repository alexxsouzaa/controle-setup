import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStorageEntity, getStorage } from '../lib/storage';
import type { Flow } from '../types';

const FLOWS_KEY = 'flows' as const;

let $id = 0;
const nowISO = () => new Date().toISOString().slice(0, 10);
const uid = (prefix: string) => { $id++; return `${prefix}-${Date.now()}-${$id}`; };
const getUser = () => { try { return localStorage.getItem('cs-user') || 'Operador'; } catch { return 'Operador'; } };

export function useFlows() {
  return useQuery({
    queryKey: [FLOWS_KEY],
    queryFn: () => getStorage().flows,
  });
}

export function useAddFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (f: Partial<Flow> & { name: string }) => {
      const storage = getStorage();
      const existingVersions = storage.flows.filter(fl => fl.code === f.code || fl.product === f.product).length;
      const newFlow: Flow = {
        ...f,
        id: uid('flow'),
        date: f.date || nowISO(),
        ver: f.ver || `V${existingVersions + 1}`,
        createdBy: f.createdBy || getUser(),
        createdAt: nowISO(),
        updatedBy: getUser(),
        updatedAt: nowISO(),
      } as Flow;
      updateStorageEntity(FLOWS_KEY, flows => [...flows, newFlow]);
      return newFlow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

export function useUpdateFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Flow> }) => {
      updateStorageEntity(FLOWS_KEY, flows => flows.map(f => f.id === id ? { ...f, ...updates, updatedBy: getUser(), updatedAt: nowISO() } as Flow : f));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

export function useDuplicateFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const target = getStorage().flows.find(f => f.id === id);
      if (!target) return;
      const existing = getStorage().flows.filter(fl => fl.code === target.code).length;
      const copy: Flow = {
        ...target,
        id: uid('flow'),
        date: nowISO(),
        ver: `V${existing + 1}`,
        createdBy: getUser(),
        createdAt: nowISO(),
        updatedBy: getUser(),
        updatedAt: nowISO(),
      };
      updateStorageEntity(FLOWS_KEY, flows => [...flows, copy]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

export function useDeleteFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { updateStorageEntity(FLOWS_KEY, flows => flows.filter(f => f.id !== id)); },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}

export function useDeleteFlows() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => { const set = new Set(ids); updateStorageEntity(FLOWS_KEY, flows => flows.filter(f => !set.has(f.id))); },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FLOWS_KEY] }),
  });
}
