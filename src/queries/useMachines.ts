import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStorageEntity, getStorage } from '../lib/storage';
import type { Machine } from '../types';

const MACHINES_KEY = 'machines' as const;

let $id = 0;
const nowISO = () => new Date().toISOString().slice(0, 10);
const uid = (prefix: string) => { $id++; return `${prefix}-${Date.now()}-${$id}`; };
const getUser = () => { try { return localStorage.getItem('cs-user') || 'Operador'; } catch { return 'Operador'; } };

export function useMachines() {
  return useQuery({
    queryKey: [MACHINES_KEY],
    queryFn: () => getStorage().machines,
  });
}

export function useAddMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: Partial<Machine> & { name: string; uo: string }) => {
      const lines = m.lines || (m.line ? [m.line] : []);
      const toolingCategories = m.toolingCategories || m.ferramentais || [];
      const newMachine: Machine = {
        ...m,
        id: m.id || uid('mac'),
        lines,
        toolingCategories,
        updatedAt: nowISO(),
        createdAt: m.createdAt || nowISO(),
        createdBy: m.createdBy || getUser(),
      } as Machine;
      updateStorageEntity(MACHINES_KEY, machines => [...machines, newMachine]);
      return newMachine;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [MACHINES_KEY] }),
  });
}

export function useUpdateMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Machine> }) => {
      updateStorageEntity(MACHINES_KEY, machines => machines.map(m => m.id === id ? { ...m, ...updates, updatedAt: nowISO() } as Machine : m));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [MACHINES_KEY] }),
  });
}

export function useDeleteMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { updateStorageEntity(MACHINES_KEY, machines => machines.filter(m => m.id !== id)); },
    onSuccess: () => qc.invalidateQueries({ queryKey: [MACHINES_KEY] }),
  });
}

export function useDeleteMachines() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => { const set = new Set(ids); updateStorageEntity(MACHINES_KEY, machines => machines.filter(m => !set.has(m.id))); },
    onSuccess: () => qc.invalidateQueries({ queryKey: [MACHINES_KEY] }),
  });
}
