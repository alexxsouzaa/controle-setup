import { createContext, useState, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'controle-setup-data';

const DEFAULT_MACHINES = [
  { id: 'norden-c5',  name: 'Norden C5',  line: 'C5',  uo: 'Bisnagas', type: 'Enchedora de Bisnagas',      outils: 6,  updatedAt: '2025-07-10', createdAt: '2024-03-15', createdBy: 'Carlos Silva' },
  { id: 'norden-c6',  name: 'Norden C6',  line: 'C6',  uo: 'Bisnagas', type: 'Enchedora de Bisnagas',      outils: 10, updatedAt: '2025-07-08', createdAt: '2024-06-02', createdBy: 'Carlos Silva' },
  { id: 'norden-c12', name: 'Norden C12', line: 'C12', uo: 'Bisnagas', type: 'Enchedora de Bisnagas',      outils: 13, updatedAt: '2025-06-28', createdAt: '2024-09-10', createdBy: 'Ana Oliveira' },
  { id: 'norden-c13', name: 'Norden C13', line: 'C13', uo: 'Bisnagas', type: 'Enchedora com Selagem a Quente', outils: 13, updatedAt: '2025-06-15', createdAt: '2024-11-01', createdBy: 'Ana Oliveira' },
  { id: 'tgm-c4',     name: 'TGM C4',     line: 'C4',  uo: 'Bisnagas', type: 'Enchedora de Pequeno Porte', outils: 8,  updatedAt: '2025-07-12', createdAt: '2023-08-20', createdBy: 'Carlos Silva' },
  { id: 'iwk-fp35',   name: 'IWK FP-35',  line: 'C7',  uo: 'Bisnagas', type: 'Enchedora de Bisnagas',      outils: 12, updatedAt: '2025-07-05', createdAt: '2025-01-14', createdBy: 'Marcos Reis' },
  { id: 'laesse-mk2', name: 'Laesse MK-200', line: 'C8', uo: 'Bisnagas', type: 'Enchedora de Bisnagas',      outils: 10, updatedAt: '2025-07-01', createdAt: '2025-04-22', createdBy: 'Marcos Reis' },
  { id: 'gron-pfk6',  name: 'Groninger PFK-600', line: 'P1', uo: 'Potes',  type: 'Enchedora de Potes',      outils: 8,  updatedAt: '2025-07-10', createdAt: '2024-05-18', createdBy: 'Carlos Silva' },
  { id: 'axo-a400',   name: 'Axomatic A-400',    line: 'P2', uo: 'Potes',  type: 'Enchedora de Potes',      outils: 6,  updatedAt: '2025-07-03', createdAt: '2024-07-30', createdBy: 'Ana Oliveira' },
  { id: 'march-ma80', name: 'Marchesini MA-80',  line: 'P3', uo: 'Potes',  type: 'Dosadora de Potes',       outils: 5,  updatedAt: '2025-06-20', createdAt: '2025-02-05', createdBy: 'Marcos Reis' },
  { id: 'iwk-tfs30',  name: 'IWK TFS-30',        line: 'R1', uo: 'Refil',  type: 'Enchedora de Refil',      outils: 9,  updatedAt: '2025-07-14', createdAt: '2024-08-12', createdBy: 'Carlos Silva' },
  { id: 'norden-nm2', name: 'Nordenmatic NM-200', line: 'R2', uo: 'Refil',  type: 'Enchedora de Refil',      outils: 11, updatedAt: '2025-07-09', createdAt: '2025-03-01', createdBy: 'Ana Oliveira' },
];

const DEFAULT_PRODUCTS = [
  { id: 'SHP-400-001', code: 'SHP-400-001', name: 'Shampoo Nutritivo', category: 'Shampoo', family: 'Capilar', vol: 400, unit: 'ml', packaging: 'Bisnaga PEAD', weight: '420 g', created: '2025-06-12' },
  { id: 'CND-250-002', code: 'CND-250-002', name: 'Condicionador Reparação', category: 'Condicionador', family: 'Capilar', vol: 250, unit: 'ml', packaging: 'Bisnaga PEAD', weight: '270 g', created: '2025-06-10' },
  { id: 'CRM-100-003', code: 'CRM-100-003', name: 'Creme Hidratante', category: 'Creme', family: 'Corporal', vol: 100, unit: 'g', packaging: 'Bisnaga PEBD', weight: '115 g', created: '2025-06-08' },
];

const DEFAULT_PIECES = [
  { id: 'CP-PD-001', code: 'CP-PD-001', name: 'Copos Padrão', category: 'Copos', compat: 'Norden C5, C6, C12, C13', location: 'Armário A3', stock: 24, min: 8, unit: 'un' },
  { id: 'CP-ES-002', code: 'CP-ES-002', name: 'Copos Estreito', category: 'Copos', compat: 'Norden C5, C6, C12, C13', location: 'Armário A3', stock: 14, min: 6, unit: 'un' },
  { id: 'CP-LG-003', code: 'CP-LG-003', name: 'Copos Largo', category: 'Copos', compat: 'Norden C5, C6, C12, C13', location: 'Armário A3', stock: 8, min: 4, unit: 'un' },
  { id: 'PT-PD-004', code: 'PT-PD-004', name: 'Ponteira do Empurrador Padrão', category: 'Ponteira do Empurrador', compat: 'Norden C5, C6, C12, C13', location: 'Armário A3', stock: 16, min: 4, unit: 'un' },
  { id: 'PT-ES-005', code: 'PT-ES-005', name: 'Ponteira do Empurrador Estreita', category: 'Ponteira do Empurrador', compat: 'Norden C5, C6', location: 'Armário A3', stock: 6, min: 2, unit: 'un' },
  { id: 'PT-LG-006', code: 'PT-LG-006', name: 'Ponteira do Empurrador Larga', category: 'Ponteira do Empurrador', compat: 'Norden C12, C13', location: 'Armário A3', stock: 5, min: 2, unit: 'un' },
  { id: 'PZ-PD-007', code: 'PZ-PD-007', name: 'Ponteira do Centralizador Padrão', category: 'Ponteira do Centralizador', compat: 'Norden C5, C6, C12, C13', location: 'Armário B1', stock: 12, min: 4, unit: 'un' },
  { id: 'PZ-ES-008', code: 'PZ-ES-008', name: 'Ponteira do Centralizador Estreita', category: 'Ponteira do Centralizador', compat: 'Norden C5, C6', location: 'Armário B1', stock: 4, min: 2, unit: 'un' },
  { id: 'EL-PD-009', code: 'EL-PD-009', name: 'Estação de Limpeza Padrão', category: 'Estação de Limpeza', compat: 'Norden C12, C13', location: 'Armário B1', stock: 6, min: 2, unit: 'un' },
  { id: 'EL-RF-010', code: 'EL-RF-010', name: 'Estação de Limpeza Reforçada', category: 'Estação de Limpeza', compat: 'Norden C13', location: 'Armário B1', stock: 3, min: 1, unit: 'un' },
  { id: 'BI-PD-011', code: 'BI-PD-011', name: 'Bico de Envase Padrão', category: 'Bico de Envase', compat: 'Norden C5, C6, C12, C13', location: 'Armário B2', stock: 18, min: 6, unit: 'un' },
  { id: 'BI-AV-012', code: 'BI-AV-012', name: 'Bico de Envase Alta Vazão', category: 'Bico de Envase', compat: 'Norden C12, C13', location: 'Armário B2', stock: 10, min: 4, unit: 'un' },
  { id: 'BI-PR-013', code: 'BI-PR-013', name: 'Bico de Envase Precisão', category: 'Bico de Envase', compat: 'Norden C5, C6', location: 'Armário B2', stock: 7, min: 3, unit: 'un' },
  { id: 'FC-PD-014', code: 'FC-PD-014', name: 'Faca Padrão', category: 'Faca', compat: 'Norden C5, C6, C12, C13', location: 'Armário B2', stock: 30, min: 10, unit: 'un' },
  { id: 'FC-SR-015', code: 'FC-SR-015', name: 'Faca Serrilhada', category: 'Faca', compat: 'Norden C12, C13', location: 'Armário B2', stock: 8, min: 4, unit: 'un' },
  { id: 'FC-LS-016', code: 'FC-LS-016', name: 'Faca Lisa', category: 'Faca', compat: 'Norden C5, C6', location: 'Armário B2', stock: 12, min: 6, unit: 'un' },
  { id: 'MD-PD-017', code: 'MD-PD-017', name: 'Mordente Padrão', category: 'Mordente', compat: 'Norden C5, C6, C12, C13', location: 'Armário C1', stock: 12, min: 4, unit: 'un' },
  { id: 'MD-RF-018', code: 'MD-RF-018', name: 'Mordente Reforçado', category: 'Mordente', compat: 'Norden C12, C13', location: 'Armário C1', stock: 6, min: 2, unit: 'un' },
  { id: 'BC-PD-019', code: 'BC-PD-019', name: 'Berço Padrão', category: 'Berço', compat: 'Norden C5, C6, C12, C13', location: 'Armário C1', stock: 10, min: 4, unit: 'un' },
  { id: 'BC-AJ-020', code: 'BC-AJ-020', name: 'Berço Ajustável', category: 'Berço', compat: 'Norden C12, C13', location: 'Armário C1', stock: 5, min: 2, unit: 'un' },
  { id: 'SC-PD-021', code: 'SC-PD-021', name: 'Suporte Padrão', category: 'Suporte do Camisa do Bico de Ar Quente', compat: 'Norden C12, C13', location: 'Armário D1', stock: 8, min: 3, unit: 'un' },
  { id: 'SC-RF-022', code: 'SC-RF-022', name: 'Suporte Reforçado', category: 'Suporte do Camisa do Bico de Ar Quente', compat: 'Norden C13', location: 'Armário D1', stock: 4, min: 2, unit: 'un' },
  { id: 'CB-PD-023', code: 'CB-PD-023', name: 'Camisa Padrão', category: 'Camisa do Bico de Ar Quente', compat: 'Norden C12, C13', location: 'Armário D1', stock: 10, min: 4, unit: 'un' },
  { id: 'CB-ES-024', code: 'CB-ES-024', name: 'Camisa Estreita', category: 'Camisa do Bico de Ar Quente', compat: 'Norden C12', location: 'Armário D1', stock: 5, min: 2, unit: 'un' },
  { id: 'CB-LG-025', code: 'CB-LG-025', name: 'Camisa Larga', category: 'Camisa do Bico de Ar Quente', compat: 'Norden C13', location: 'Armário D1', stock: 4, min: 2, unit: 'un' },
  { id: 'PB-PD-026', code: 'PB-PD-026', name: 'Ponteira do Bico Padrão', category: 'Ponteira do Bico de Ar Quente', compat: 'Norden C12, C13', location: 'Armário D2', stock: 8, min: 3, unit: 'un' },
  { id: 'PB-ES-027', code: 'PB-ES-027', name: 'Ponteira do Bico Estreita', category: 'Ponteira do Bico de Ar Quente', compat: 'Norden C12', location: 'Armário D2', stock: 4, min: 2, unit: 'un' },
  { id: 'PB-LG-028', code: 'PB-LG-028', name: 'Ponteira do Bico Larga', category: 'Ponteira do Bico de Ar Quente', compat: 'Norden C13', location: 'Armário D2', stock: 3, min: 1, unit: 'un' },
  { id: 'RG-PD-029', code: 'RG-PD-029', name: 'Régua do Mordente Padrão', category: 'Régua do Mordente', compat: 'Norden C5, C6, C12, C13', location: 'Armário C2', stock: 10, min: 4, unit: 'un' },
  { id: 'RG-ES-030', code: 'RG-ES-030', name: 'Régua do Mordente Estreita', category: 'Régua do Mordente', compat: 'Norden C5, C6', location: 'Armário C2', stock: 6, min: 3, unit: 'un' },
  { id: 'BT-PD-031', code: 'BT-PD-031', name: 'Batedor do Mordente Padrão', category: 'Batedor do Mordente', compat: 'Norden C5, C6, C12, C13', location: 'Armário C2', stock: 8, min: 3, unit: 'un' },
  { id: 'BT-RF-032', code: 'BT-RF-032', name: 'Batedor do Mordente Reforçado', category: 'Batedor do Mordente', compat: 'Norden C12, C13', location: 'Armário C2', stock: 4, min: 2, unit: 'un' },
];

const DEFAULT_FLOWS = [
  { id: 'flow-001', name: 'SHP-400-001 - Shampoo Nutritivo (v1.0)', machine: 'Norden C5', product: 'Shampoo Nutritivo', code: 'SHP-400-001', vol: '400 ml', date: '2025-06-12', ver: 'v1.0', status: 'Concluído' },
  { id: 'flow-002', name: 'CND-250-002 - Condicionador Reparação (v1.2)', machine: 'Norden C6', product: 'Condicionador Reparação', code: 'CND-250-002', vol: '250 ml', date: '2025-06-10', ver: 'v1.2', status: 'Concluído' },
  { id: 'flow-003', name: 'CRM-100-003 - Creme Hidratante (v1.0)', machine: 'Norden C12', product: 'Creme Hidratante', code: 'CRM-100-003', vol: '100 g', date: '2025-06-08', ver: 'v1.0', status: 'Concluído' },
];

const DEFAULT_FORMATOS = [];
const DEFAULT_HISTORY = [];

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        machines: parsed.machines || DEFAULT_MACHINES,
        products: parsed.products || DEFAULT_PRODUCTS,
        pieces: parsed.pieces || DEFAULT_PIECES,
        flows: parsed.flows || DEFAULT_FLOWS,
        formatos: parsed.formatos || DEFAULT_FORMATOS,
        history: parsed.history || DEFAULT_HISTORY,
      };
    }
  } catch (e) { /* ignore */ }
  return {
    machines: DEFAULT_MACHINES,
    products: DEFAULT_PRODUCTS,
    pieces: DEFAULT_PIECES,
    flows: DEFAULT_FLOWS,
    formatos: DEFAULT_FORMATOS,
    history: DEFAULT_HISTORY,
  };
}

let nextId = 0;
function uid(prefix) {
  nextId++;
  return `${prefix}-${Date.now()}-${nextId}`;
}

const SHAPE = { machines: [], products: [], pieces: [], flows: [], formatos: [], history: [], stats: { totalFlows: 0, totalMachines: 0, totalProducts: 0, totalPieces: 0, totalFormatos: 0, activeMachines: 0, flowsToday: 0, lowStockPieces: 0 } };
export const AppDataContext = createContext(SHAPE);

export function AppDataProvider({ children }) {
  const [data, setData] = useState(loadData);

  const save = useCallback((newData) => {
    setData(newData);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newData)); } catch (e) { /* quota exceeded */ }
  }, []);

  const actions = useMemo(() => ({
    // Machines
    addMachine: (m) => save({ ...data, machines: [...data.machines, { ...m, id: uid('mac'), updatedAt: new Date().toISOString().slice(0, 10), createdAt: m.createdAt || new Date().toISOString().slice(0, 10) }] }),
    updateMachine: (id, updates) => save({ ...data, machines: data.machines.map(m => m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString().slice(0, 10) } : m) }),
    deleteMachine: (id) => save({ ...data, machines: data.machines.filter(m => m.id !== id) }),

    // Products
    addProduct: (p) => save({ ...data, products: [...data.products, { ...p, id: p.id || uid('prd'), code: p.code, created: p.created || new Date().toISOString().slice(0, 10) }] }),
    updateProduct: (id, updates) => save({ ...data, products: data.products.map(p => p.id === id ? { ...p, ...updates } : p) }),
    deleteProduct: (id) => save({ ...data, products: data.products.filter(p => p.id !== id) }),

    // Pieces
    addPiece: (p) => save({ ...data, pieces: [...data.pieces, { ...p, id: p.id || uid('pcs') }] }),
    updatePiece: (id, updates) => save({ ...data, pieces: data.pieces.map(p => p.id === id ? { ...p, ...updates } : p) }),
    deletePiece: (id) => save({ ...data, pieces: data.pieces.filter(p => p.id !== id) }),

    // Flows
    addFlow: (f) => save({ ...data, flows: [...data.flows, { ...f, id: uid('flow'), date: f.date || new Date().toISOString().slice(0, 10), ver: f.ver || 'v1.0' }] }),
    updateFlow: (id, updates) => save({ ...data, flows: data.flows.map(f => f.id === id ? { ...f, ...updates } : f) }),
    duplicateFlow: (id) => {
      const flow = data.flows.find(f => f.id === id);
      if (!flow) return;
      const copy = { ...flow, id: uid('flow'), name: flow.name.replace(/\(v[\d.]+\)/g, `(v${new Date().toISOString().slice(0, 10).replace(/-/g, '')})`) || `${flow.name} (cópia)`, date: new Date().toISOString().slice(0, 10) };
      save({ ...data, flows: [...data.flows, copy] });
    },
    deleteFlow: (id) => save({ ...data, flows: data.flows.filter(f => f.id !== id) }),
    deleteFlows: (ids) => { const set = new Set(ids); save({ ...data, flows: data.flows.filter(f => !set.has(f.id)) }); },

    // Formatos
    addFormato: (f) => save({ ...data, formatos: [...data.formatos, { ...f, id: uid('fmt'), createdAt: new Date().toISOString().slice(0, 10) }] }),
    updateFormato: (id, updates) => save({ ...data, formatos: data.formatos.map(f => f.id === id ? { ...f, ...updates } : f) }),
    deleteFormato: (id) => save({ ...data, formatos: data.formatos.filter(f => f.id !== id) }),

    // History
    logAction: (type, entity, detail) => save({
      ...data,
      history: [{ id: uid('log'), type, entity, detail, date: new Date().toISOString() }, ...data.history].slice(0, 200),
    }),
    clearHistory: () => save({ ...data, history: [] }),

    // Export / Import
    exportAll: () => JSON.stringify(data, null, 2),
    importData: (imported) => {
      if (!imported || typeof imported !== 'object') return 0;
      const merged = { ...data };
      let total = 0;
      const ENTITY_KEYS = ['flows', 'machines', 'products', 'pieces', 'formatos'];
      ENTITY_KEYS.forEach(key => {
        if (Array.isArray(imported[key]) && imported[key].length > 0) {
          const prefix = key === 'formatos' ? 'fmt' : key === 'pieces' ? 'pcs' : key === 'products' ? 'prd' : key === 'machines' ? 'mac' : 'flow';
          const newItems = imported[key].map(item => ({
            ...item,
            id: uid(prefix),
            date: key === 'flows' ? (item.date || new Date().toISOString().slice(0, 10)) : item.date,
            ver: key === 'flows' ? (item.ver || 'v1.0') : item.ver,
          }));
          merged[key] = [...data[key], ...newItems];
          total += newItems.length;
        }
      });
      if (total > 0) save(merged);
      return total;
    },
  }), [data, save]);

  const stats = useMemo(() => ({
    totalFlows: data.flows.length,
    totalMachines: data.machines.length,
    totalProducts: data.products.length,
    totalPieces: data.pieces.length,
    totalFormatos: data.formatos.length,
    flowsToday: data.flows.filter(f => f.date === new Date().toISOString().slice(0, 10)).length,
    lowStockPieces: data.pieces.filter(p => p.stock <= p.min).length,
  }), [data]);

  return (
    <AppDataContext.Provider value={{ ...data, ...actions, stats }}>
      {children}
    </AppDataContext.Provider>
  );
}
