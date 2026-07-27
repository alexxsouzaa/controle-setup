import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStorageEntity, getStorage } from '../lib/storage';
import type { Product } from '../types';

const PRODUCTS_KEY = 'products' as const;

let $id = 0;
const nowISO = () => new Date().toISOString().slice(0, 10);
const uid = (prefix: string) => { $id++; return `${prefix}-${Date.now()}-${$id}`; };
const getUser = () => { try { return localStorage.getItem('cs-user') || 'Operador'; } catch { return 'Operador'; } };

export function useProducts() {
  return useQuery({
    queryKey: [PRODUCTS_KEY],
    queryFn: () => getStorage().products,
  });
}

export function useAddProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<Product> & { name: string; code: string; category: string }) => {
      const newProduct: Product = {
        ...p,
        id: p.id || uid('prod'),
        createdAt: p.createdAt || nowISO(),
      };
      updateStorageEntity(PRODUCTS_KEY, products => [...products, newProduct]);
      return newProduct;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      updateStorageEntity(PRODUCTS_KEY, products => products.map(p => p.id === id ? { ...p, ...updates } as Product : p));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { updateStorageEntity(PRODUCTS_KEY, products => products.filter(p => p.id !== id)); },
    onSuccess: () => qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  });
}

export function useDeleteProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => { const set = new Set(ids); updateStorageEntity(PRODUCTS_KEY, products => products.filter(p => !set.has(p.id))); },
    onSuccess: () => qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  });
}
