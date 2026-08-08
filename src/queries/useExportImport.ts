import { useMutation, useQueryClient } from '@tanstack/react-query';
import { exportApi } from '../lib/api';

const ENTITY_KEYS = ['flows', 'machines', 'products', 'pieces', 'formatos'] as const;

export function useExport() {
  const qc = useQueryClient();
  return () => {
    const pick = (key: string): unknown[] => {
      const data = qc.getQueryData([key]);
      return Array.isArray(data) ? data : [];
    };
    const data: Record<string, unknown> = {
      machines: pick('machines'),
      products: pick('products'),
      pieces: pick('pieces'),
      flows: pick('flows'),
      formatos: pick('formatos'),
      history: qc.getQueryData(['history']) ?? [],
      config: qc.getQueryData(['config']) ?? {},
    };
    return JSON.stringify(data, null, 2);
  };
}

export function useImportData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imported: unknown) => exportApi.importAll(imported),
    onSuccess: () => {
      for (const key of ENTITY_KEYS) {
        qc.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
