import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../lib/api';
import type { Product } from '../types';

const PRODUCTS_KEY = 'products' as const;

export function useProducts() {
  return useQuery({
    queryKey: [PRODUCTS_KEY],
    queryFn: () => productsApi.list(),
  });
}

export function useAddProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<Product> & { name: string; code: string; category: string }) => productsApi.create(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) => productsApi.update(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  });
}

export function useDeleteProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => productsApi.removeMany(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  });
}
