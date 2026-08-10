import { useMutation, useQueryClient } from '@tanstack/react-query';
import { seedDemoData } from '../lib/seed';
import { migrateLegacyData, assignOrphanedToUnit } from '../lib/migrate';

const TOOLS_KEYS = ['units', 'lines', 'machines', 'products', 'pieces', 'flows', 'formatos', 'history', 'config'];

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  TOOLS_KEYS.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
}

export function useSeedDemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => seedDemoData(),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useMigrateLegacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => migrateLegacyData(),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useAssignOrphaned() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, options }: { unitId: string; options: { products: boolean; pieces: boolean } }) =>
      assignOrphanedToUnit(unitId, options),
    onSuccess: () => invalidateAll(qc),
  });
}
