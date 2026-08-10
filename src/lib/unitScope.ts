import type { ResourceScope } from '../features/units/types/unit.types';

interface ScopedResource {
  unitId?: string;
  scope?: ResourceScope;
}

function hasUnitId(value: unknown): value is { unitId: string } {
  return !!value && typeof value === 'object' && typeof (value as { unitId?: unknown }).unitId === 'string';
}

/**
 * Filtra recursos pelo contexto de UO ativo.
 *
 * - `scope === 'global'` → disponível em qualquer UO.
 * - `scope === 'unit'` (ou sem escopo explícito) → disponível apenas quando o
 *   `unitId` do recurso coincide com a UO ativa.
 * - Recursos legados sem `unitId` são mantidos quando a UO ativa não for
 *   informada (visualização "Todas"), para não esconder dados existentes.
 */
export function filterByUnitScope<T extends ScopedResource>(
  items: T[],
  activeUnitId: string | null,
): T[] {
  if (!activeUnitId) return items;
  return items.filter((item) => {
    if (item.scope === 'global') return true;
    if (hasUnitId(item)) return item.unitId === activeUnitId;
    return false;
  });
}
