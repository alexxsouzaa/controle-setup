import type { Machine, Product, Piece, Flow, Formato, HistoryEntry, Config } from '../types';

const STORAGE_KEY = 'controle-setup-data';

export interface StorageData {
  machines: Machine[];
  products: Product[];
  pieces: Piece[];
  flows: Flow[];
  formatos: Formato[];
  history: HistoryEntry[];
  config: Config;
}

function getDefaults(): StorageData {
  return { machines: [], products: [], pieces: [], flows: [], formatos: [], history: [], config: { uoConfigs: {} } };
}

export function getStorage(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        machines: parsed.machines || [],
        products: parsed.products || [],
        pieces: parsed.pieces || [],
        flows: parsed.flows || [],
        formatos: parsed.formatos || [],
        history: parsed.history || [],
        config: { uoConfigs: {}, ...parsed.config },
      };
    }
  } catch { /* ignore */ }
  return getDefaults();
}

export function setStorage(data: StorageData): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* quota */ }
}

export function updateStorageEntity<K extends keyof StorageData>(key: K, updater: (prev: StorageData[K]) => StorageData[K]): StorageData {
  const current = getStorage();
  const next = { ...current, [key]: updater(current[key]) };
  setStorage(next);
  return next;
}
