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

const DEFAULTS: StorageData = {
  machines: [
    { id: 'norden-c5',  name: 'Norden C5',  line: 'C5',  uo: 'Bisnagas',                    updatedAt: '2025-07-10', createdAt: '2024-03-15', createdBy: 'Carlos Silva' },
    { id: 'norden-c6',  name: 'Norden C6',  line: 'C6',  uo: 'Bisnagas',                    updatedAt: '2025-07-08', createdAt: '2024-06-02', createdBy: 'Carlos Silva' },
    { id: 'norden-c12', name: 'Norden C12', line: 'C12', uo: 'Bisnagas',                    updatedAt: '2025-06-28', createdAt: '2024-09-10', createdBy: 'Ana Oliveira' },
    { id: 'norden-c13', name: 'Norden C13', line: 'C13', uo: 'Bisnagas',                    updatedAt: '2025-06-15', createdAt: '2024-11-01', createdBy: 'Ana Oliveira' },
    { id: 'tgm-c4',     name: 'TGM C4',     line: 'C4',  uo: 'Bisnagas',                    updatedAt: '2025-07-12', createdAt: '2023-08-20', createdBy: 'Carlos Silva' },
    { id: 'iwk-fp35',   name: 'IWK FP-35',  line: 'C7',  uo: 'Bisnagas',                    updatedAt: '2025-07-05', createdAt: '2025-01-14', createdBy: 'Marcos Reis' },
    { id: 'laesse-mk2', name: 'Laesse MK-200', line: 'C8', uo: 'Bisnagas',                  updatedAt: '2025-07-01', createdAt: '2025-04-22', createdBy: 'Marcos Reis' },
    { id: 'gron-pfk6',  name: 'Groninger PFK-600', line: 'P1', uo: 'Potes',                  updatedAt: '2025-07-10', createdAt: '2024-05-18', createdBy: 'Carlos Silva' },
    { id: 'axo-a400',   name: 'Axomatic A-400',    line: 'P2', uo: 'Potes',                  updatedAt: '2025-07-03', createdAt: '2024-07-30', createdBy: 'Ana Oliveira' },
    { id: 'march-ma80', name: 'Marchesini MA-80',  line: 'P3', uo: 'Potes',                  updatedAt: '2025-06-20', createdAt: '2025-02-05', createdBy: 'Marcos Reis' },
    { id: 'iwk-tfs30',  name: 'IWK TFS-30',        line: 'R1', uo: 'Refil',                  updatedAt: '2025-07-14', createdAt: '2024-08-12', createdBy: 'Carlos Silva' },
    { id: 'norden-nm2', name: 'Nordenmatic NM-200', line: 'R2', uo: 'Refil',                  updatedAt: '2025-07-09', createdAt: '2025-03-01', createdBy: 'Ana Oliveira' },
  ] as Machine[],
  products: [
    { id: 'SHP-400-001', code: 'SHP-400-001', name: 'Shampoo Nutritivo', category: 'Shampoo', family: 'Capilar', vol: 400, unit: 'ml', packaging: 'Bisnaga PEAD', weight: '420 g', created: '2025-06-12' },
    { id: 'CND-250-002', code: 'CND-250-002', name: 'Condicionador Reparação', category: 'Condicionador', family: 'Capilar', vol: 250, unit: 'ml', packaging: 'Bisnaga PEAD', weight: '270 g', created: '2025-06-10' },
    { id: 'CRM-100-003', code: 'CRM-100-003', name: 'Creme Hidratante', category: 'Creme', family: 'Corporal', vol: 100, unit: 'g', packaging: 'Bisnaga PEBD', weight: '115 g', created: '2025-06-08' },
  ] as Product[],
  pieces: [
    { id: 'CP-PD-001', code: 'CP-PD-001', name: 'Copos Padrão', category: 'Copos', diameterMin: 30, diameterMax: 50, compat: 'Norden C5, C6, C12, C13', location: 'Armário A3', stock: 24, min: 8, unit: 'un' },
    { id: 'CP-ES-002', code: 'CP-ES-002', name: 'Copos Estreito', category: 'Copos', diameterMin: 10, diameterMax: 29, compat: 'Norden C5, C6, C12, C13', location: 'Armário A3', stock: 14, min: 6, unit: 'un' },
    { id: 'CP-LG-003', code: 'CP-LG-003', name: 'Copos Largo', category: 'Copos', diameterMin: 51, diameterMax: 80, compat: 'Norden C5, C6, C12, C13', location: 'Armário A3', stock: 8, min: 4, unit: 'un' },
    { id: 'PT-PD-004', code: 'PT-PD-004', name: 'Ponteira do Empurrador Padrão', category: 'Ponteira do Empurrador', diameterMin: 30, diameterMax: 50, compat: 'Norden C5, C6, C12, C13', location: 'Armário A3', stock: 16, min: 4, unit: 'un' },
    { id: 'PT-ES-005', code: 'PT-ES-005', name: 'Ponteira do Empurrador Estreita', category: 'Ponteira do Empurrador', diameterMin: 10, diameterMax: 29, compat: 'Norden C5, C6', location: 'Armário A3', stock: 6, min: 2, unit: 'un' },
    { id: 'PT-LG-006', code: 'PT-LG-006', name: 'Ponteira do Empurrador Larga', category: 'Ponteira do Empurrador', diameterMin: 51, diameterMax: 80, compat: 'Norden C12, C13', location: 'Armário A3', stock: 5, min: 2, unit: 'un' },
    { id: 'PZ-PD-007', code: 'PZ-PD-007', name: 'Ponteira do Centralizador Padrão', category: 'Ponteira do Centralizador', diameterMin: 30, diameterMax: 50, compat: 'Norden C5, C6, C12, C13', location: 'Armário B1', stock: 12, min: 4, unit: 'un' },
    { id: 'PZ-ES-008', code: 'PZ-ES-008', name: 'Ponteira do Centralizador Estreita', category: 'Ponteira do Centralizador', diameterMin: 10, diameterMax: 29, compat: 'Norden C5, C6', location: 'Armário B1', stock: 4, min: 2, unit: 'un' },
    { id: 'EL-PD-009', code: 'EL-PD-009', name: 'Estação de Limpeza Padrão', category: 'Estação de Limpeza', diameterMin: 30, diameterMax: 50, compat: 'Norden C12, C13', location: 'Armário B1', stock: 6, min: 2, unit: 'un' },
    { id: 'EL-RF-010', code: 'EL-RF-010', name: 'Estação de Limpeza Reforçada', category: 'Estação de Limpeza', diameterMin: 51, diameterMax: 80, compat: 'Norden C13', location: 'Armário B1', stock: 3, min: 1, unit: 'un' },
    { id: 'BI-PD-011', code: 'BI-PD-011', name: 'Bico de Envase Padrão', category: 'Bico de Envase', diameterMin: 30, diameterMax: 50, compat: 'Norden C5, C6, C12, C13', location: 'Armário B2', stock: 18, min: 6, unit: 'un' },
    { id: 'BI-AV-012', code: 'BI-AV-012', name: 'Bico de Envase Alta Vazão', category: 'Bico de Envase', diameterMin: 51, diameterMax: 80, compat: 'Norden C12, C13', location: 'Armário B2', stock: 10, min: 4, unit: 'un' },
    { id: 'BI-PR-013', code: 'BI-PR-013', name: 'Bico de Envase Precisão', category: 'Bico de Envase', diameterMin: 10, diameterMax: 29, compat: 'Norden C5, C6', location: 'Armário B2', stock: 7, min: 3, unit: 'un' },
    { id: 'FC-PD-014', code: 'FC-PD-014', name: 'Faca Padrão', category: 'Faca', sealingType: 'padrão', compat: 'Norden C5, C6, C12, C13', location: 'Armário B2', stock: 30, min: 10, unit: 'un' },
    { id: 'FC-SR-015', code: 'FC-SR-015', name: 'Faca Serrilhada', category: 'Faca', sealingType: 'serrilhada', compat: 'Norden C12, C13', location: 'Armário B2', stock: 8, min: 4, unit: 'un' },
    { id: 'FC-LS-016', code: 'FC-LS-016', name: 'Faca Lisa', category: 'Faca', sealingType: 'lisa', compat: 'Norden C5, C6', location: 'Armário B2', stock: 12, min: 6, unit: 'un' },
    { id: 'MD-PD-017', code: 'MD-PD-017', name: 'Mordente Padrão', category: 'Mordente', sealingType: 'padrão', compat: 'Norden C5, C6, C12, C13', location: 'Armário C1', stock: 12, min: 4, unit: 'un' },
    { id: 'MD-RF-018', code: 'MD-RF-018', name: 'Mordente Reforçado', category: 'Mordente', sealingType: 'reforçado', compat: 'Norden C12, C13', location: 'Armário C1', stock: 6, min: 2, unit: 'un' },
    { id: 'BC-PD-019', code: 'BC-PD-019', name: 'Berço Padrão', category: 'Berço', diameterMin: 30, diameterMax: 50, compat: 'Norden C5, C6, C12, C13', location: 'Armário C1', stock: 10, min: 4, unit: 'un' },
    { id: 'BC-AJ-020', code: 'BC-AJ-020', name: 'Berço Ajustável', category: 'Berço', diameterMin: 10, diameterMax: 80, compat: 'Norden C12, C13', location: 'Armário C1', stock: 5, min: 2, unit: 'un' },
    { id: 'SC-PD-021', code: 'SC-PD-021', name: 'Suporte Padrão', category: 'Suporte do Camisa do Bico de Ar Quente', sealingType: 'padrão', diameterMin: 30, diameterMax: 50, compat: 'Norden C12, C13', location: 'Armário D1', stock: 8, min: 3, unit: 'un' },
    { id: 'SC-RF-022', code: 'SC-RF-022', name: 'Suporte Reforçado', category: 'Suporte do Camisa do Bico de Ar Quente', sealingType: 'reforçado', diameterMin: 51, diameterMax: 80, compat: 'Norden C13', location: 'Armário D1', stock: 4, min: 2, unit: 'un' },
    { id: 'CB-PD-023', code: 'CB-PD-023', name: 'Camisa Padrão', category: 'Camisa do Bico de Ar Quente', sealingType: 'padrão', diameterMin: 30, diameterMax: 50, compat: 'Norden C12, C13', location: 'Armário D1', stock: 10, min: 4, unit: 'un' },
    { id: 'CB-ES-024', code: 'CB-ES-024', name: 'Camisa Estreita', category: 'Camisa do Bico de Ar Quente', sealingType: 'padrão', diameterMin: 10, diameterMax: 29, compat: 'Norden C12', location: 'Armário D1', stock: 5, min: 2, unit: 'un' },
    { id: 'CB-LG-025', code: 'CB-LG-025', name: 'Camisa Larga', category: 'Camisa do Bico de Ar Quente', sealingType: 'reforçado', diameterMin: 51, diameterMax: 80, compat: 'Norden C13', location: 'Armário D1', stock: 4, min: 2, unit: 'un' },
    { id: 'PB-PD-026', code: 'PB-PD-026', name: 'Ponteira do Bico Padrão', category: 'Ponteira do Bico de Ar Quente', sealingType: 'padrão', diameterMin: 30, diameterMax: 50, compat: 'Norden C12, C13', location: 'Armário D2', stock: 8, min: 3, unit: 'un' },
    { id: 'PB-ES-027', code: 'PB-ES-027', name: 'Ponteira do Bico Estreita', category: 'Ponteira do Bico de Ar Quente', sealingType: 'padrão', diameterMin: 10, diameterMax: 29, compat: 'Norden C12', location: 'Armário D2', stock: 4, min: 2, unit: 'un' },
    { id: 'PB-LG-028', code: 'PB-LG-028', name: 'Ponteira do Bico Larga', category: 'Ponteira do Bico de Ar Quente', sealingType: 'reforçado', diameterMin: 51, diameterMax: 80, compat: 'Norden C13', location: 'Armário D2', stock: 3, min: 1, unit: 'un' },
    { id: 'RG-PD-029', code: 'RG-PD-029', name: 'Régua do Mordente Padrão', category: 'Régua do Mordente', sealingType: 'padrão', compat: 'Norden C5, C6, C12, C13', location: 'Armário C2', stock: 10, min: 4, unit: 'un' },
    { id: 'RG-ES-030', code: 'RG-ES-030', name: 'Régua do Mordente Estreita', category: 'Régua do Mordente', sealingType: 'estreita', compat: 'Norden C5, C6', location: 'Armário C2', stock: 6, min: 3, unit: 'un' },
    { id: 'BT-PD-031', code: 'BT-PD-031', name: 'Batedor do Mordente Padrão', category: 'Batedor do Mordente', sealingType: 'padrão', compat: 'Norden C5, C6, C12, C13', location: 'Armário C2', stock: 8, min: 3, unit: 'un' },
    { id: 'BT-RF-032', code: 'BT-RF-032', name: 'Batedor do Mordente Reforçado', category: 'Batedor do Mordente', sealingType: 'reforçado', compat: 'Norden C12, C13', location: 'Armário C2', stock: 4, min: 2, unit: 'un' },
  ] as Piece[],
  flows: [
    { id: 'flow-001', name: 'SHP-400-001 - Shampoo Nutritivo (v1.0)', machine: 'Norden C5', product: 'Shampoo Nutritivo', code: 'SHP-400-001', vol: '400 ml', date: '2025-06-12', ver: 'v1.0', status: 'Concluído' },
    { id: 'flow-002', name: 'CND-250-002 - Condicionador Reparação (v1.2)', machine: 'Norden C6', product: 'Condicionador Reparação', code: 'CND-250-002', vol: '250 ml', date: '2025-06-10', ver: 'v1.2', status: 'Concluído' },
    { id: 'flow-003', name: 'CRM-100-003 - Creme Hidratante (v1.0)', machine: 'Norden C12', product: 'Creme Hidratante', code: 'CRM-100-003', vol: '100 g', date: '2025-06-08', ver: 'v1.0', status: 'Concluído' },
  ] as Flow[],
  formatos: [],
  history: [],
  config: { uoConfigs: {} },
};

export function getStorage(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        machines: parsed.machines || DEFAULTS.machines,
        products: parsed.products || DEFAULTS.products,
        pieces: parsed.pieces || DEFAULTS.pieces,
        flows: parsed.flows || DEFAULTS.flows,
        formatos: parsed.formatos || DEFAULTS.formatos,
        history: parsed.history || DEFAULTS.history,
        config: { uoConfigs: {}, ...parsed.config },
      };
    }
  } catch { /* ignore */ }
  return { ...DEFAULTS };
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
