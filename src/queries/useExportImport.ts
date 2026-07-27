import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getStorage, updateStorageEntity } from '../lib/storage';

const ENTITY_KEYS = ['flows', 'machines', 'products', 'pieces', 'formatos'] as const;

let $id = 0;
const uid = (prefix: string) => { $id++; return `${prefix}-${Date.now()}-${$id}`; };

export function useExport() {
  return () => JSON.stringify(getStorage(), null, 2);
}

export function useImportData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (imported: unknown) => {
      const data = imported as Record<string, unknown>;
      let total = 0;
      for (const key of ENTITY_KEYS) {
        const items = data[key];
        if (Array.isArray(items)) {
          const newItems = items.map((item: Record<string, unknown>) => ({ ...item, id: uid(key.slice(0, 3)) }));
          updateStorageEntity(key, () => newItems as never[]);
          total += newItems.length;
        }
      }
      return total;
    },
    onSuccess: () => {
      for (const key of ENTITY_KEYS) {
        qc.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
