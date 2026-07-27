import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStorageEntity, getStorage } from '../lib/storage';
import type { Formato } from '../types';

const FORMATOS_KEY = 'formatos' as const;

let $id = 0;
const nowISO = () => new Date().toISOString().slice(0, 10);
const uid = (prefix: string) => { $id++; return `${prefix}-${Date.now()}-${$id}`; };
const getUser = () => { try { return localStorage.getItem('cs-user') || 'Operador'; } catch { return 'Operador'; } };

export function useFormatos() {
  return useQuery({
    queryKey: [FORMATOS_KEY],
    queryFn: () => getStorage().formatos,
  });
}

export function useAddFormato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (f: Partial<Formato>) => {
      const newFormato: Formato = {
        ...f,
        id: f.id || uid('fmt'),
        createdAt: f.createdAt || nowISO(),
        createdBy: f.createdBy || getUser(),
      } as Formato;
      updateStorageEntity(FORMATOS_KEY, formatos => [...formatos, newFormato]);
      return newFormato;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FORMATOS_KEY] }),
  });
}

export function useUpdateFormato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Formato> }) => {
      updateStorageEntity(FORMATOS_KEY, formatos => formatos.map(f => f.id === id ? { ...f, ...updates, updatedBy: getUser(), updatedAt: nowISO() } as Formato : f));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FORMATOS_KEY] }),
  });
}

export function useDeleteFormato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { updateStorageEntity(FORMATOS_KEY, formatos => formatos.filter(f => f.id !== id)); },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FORMATOS_KEY] }),
  });
}

export function useDeleteFormatos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => { const set = new Set(ids); updateStorageEntity(FORMATOS_KEY, formatos => formatos.filter(f => !set.has(f.id))); },
    onSuccess: () => qc.invalidateQueries({ queryKey: [FORMATOS_KEY] }),
  });
}
