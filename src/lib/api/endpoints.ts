import { getStorage, updateStorageEntity, type StorageData } from '../storage';
import {
  isApiEnabled,
  apiRequest,
  localList,
  localGet,
  localCreate,
  localUpdate,
  localRemove,
  localRemoveMany,
  uid,
  nowDate,
  nowISO,
  getUser,
  type StorageDataKey,
} from './client';
import {
  rowToMachine,
  machineToRow,
  rowToProduct,
  productToRow,
  rowToPiece,
  pieceToRow,
  rowToFormato,
  formatoToRow,
  rowToFlow,
  flowToRow,
  domainToRow,
  type DbEntityName,
  type MachineRow,
  type ProductRow,
  type PieceRow,
  type FormatoRow,
  type FlowRow,
} from './mappers';
import type { Machine, Product, Piece, Flow, Formato, Config } from '../../types';

// ---------------------------------------------------------------------------
// Máquinas
// ---------------------------------------------------------------------------

export const machinesApi = {
  async list(): Promise<Machine[]> {
    if (isApiEnabled()) return (await apiRequest<MachineRow[]>('maquinas', 'list')).map(rowToMachine);
    return localList('machines') as Machine[];
  },

  async get(id: string): Promise<Machine> {
    if (isApiEnabled()) return rowToMachine(await apiRequest<MachineRow>('maquinas', 'get', { id }));
    return localGet('machines', id) as Machine;
  },

  async create(input: Partial<Machine> & { name: string; uo: string }): Promise<Machine> {
    const lines = input.lines || (input.line ? [input.line] : []);
    const toolingCategories = input.toolingCategories || input.ferramentais || [];
    const machine: Machine = {
      ...input,
      lines,
      toolingCategories,
      updatedAt: input.updatedAt ?? nowDate(),
      createdAt: input.createdAt ?? nowDate(),
      createdBy: input.createdBy ?? getUser(),
    } as Machine;
    if (isApiEnabled()) {
      const row = await apiRequest<MachineRow>('maquinas', 'create', { body: machineToRow({ ...machine, id: undefined }) });
      return rowToMachine(row);
    }
    return localCreate('machines', { ...machine, id: input.id ?? uid('mac') }) as Machine;
  },

  async update(id: string, updates: Partial<Machine>): Promise<Machine> {
    if (isApiEnabled()) {
      const row = await apiRequest<MachineRow>('maquinas', 'update', { id, body: machineToRow(updates) });
      return rowToMachine(row);
    }
    localUpdate('machines', id, { ...updates, updatedAt: nowDate() });
    return localGet('machines', id) as Machine;
  },

  async remove(id: string): Promise<void> {
    if (isApiEnabled()) { await apiRequest('maquinas', 'delete', { id }); return; }
    localRemove('machines', id);
  },

  async removeMany(ids: string[]): Promise<void> {
    if (isApiEnabled()) { await Promise.all(ids.map((id) => apiRequest('maquinas', 'delete', { id }))); return; }
    localRemoveMany('machines', ids);
  },
};

// ---------------------------------------------------------------------------
// Produtos
// ---------------------------------------------------------------------------

export const productsApi = {
  async list(): Promise<Product[]> {
    if (isApiEnabled()) return (await apiRequest<ProductRow[]>('produtos', 'list')).map(rowToProduct);
    return localList('products') as Product[];
  },

  async get(id: string): Promise<Product> {
    if (isApiEnabled()) return rowToProduct(await apiRequest<ProductRow>('produtos', 'get', { id }));
    return localGet('products', id) as Product;
  },

  async create(input: Partial<Product> & { name: string; code: string; category: string }): Promise<Product> {
    const product: Product = {
      ...input,
      createdAt: input.createdAt ?? nowDate(),
    } as Product;
    if (isApiEnabled()) {
      const row = await apiRequest<ProductRow>('produtos', 'create', { body: productToRow({ ...product, id: undefined }) });
      return rowToProduct(row);
    }
    return localCreate('products', { ...product, id: input.id ?? uid('prod') }) as Product;
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    if (isApiEnabled()) {
      const row = await apiRequest<ProductRow>('produtos', 'update', { id, body: productToRow(updates) });
      return rowToProduct(row);
    }
    localUpdate('products', id, updates);
    return localGet('products', id) as Product;
  },

  async remove(id: string): Promise<void> {
    if (isApiEnabled()) { await apiRequest('produtos', 'delete', { id }); return; }
    localRemove('products', id);
  },

  async removeMany(ids: string[]): Promise<void> {
    if (isApiEnabled()) { await Promise.all(ids.map((id) => apiRequest('produtos', 'delete', { id }))); return; }
    localRemoveMany('products', ids);
  },
};

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

async function resolvePieceCompat(ids: string[]): Promise<string> {
  const machines = await machinesApi.list();
  return ids.map((id) => machines.find((m) => m.id === id)?.name ?? '').filter(Boolean).join(', ');
}

export const piecesApi = {
  async list(): Promise<Piece[]> {
    if (isApiEnabled()) return (await apiRequest<PieceRow[]>('pecas', 'list')).map(rowToPiece);
    return localList('pieces') as Piece[];
  },

  async get(id: string): Promise<Piece> {
    if (isApiEnabled()) return rowToPiece(await apiRequest<PieceRow>('pecas', 'get', { id }));
    return localGet('pieces', id) as Piece;
  },

  async create(input: Partial<Piece> & { name: string; category: string }): Promise<Piece> {
    const compatibleMachineIds = input.compatibleMachineIds || [];
    const compat = input.compat || (await resolvePieceCompat(compatibleMachineIds));
    const piece: Piece = {
      ...input,
      code: input.code ?? '',
      stock: input.stock ?? 0,
      min: input.min ?? 0,
      unit: input.unit ?? '',
      location: input.location ?? '',
      compat,
      compatibleMachineIds,
    } as Piece;
    if (isApiEnabled()) {
      const row = await apiRequest<PieceRow>('pecas', 'create', { body: pieceToRow({ ...piece, id: undefined }) });
      return rowToPiece(row);
    }
    return localCreate('pieces', { ...piece, id: input.id ?? uid('pc') }) as Piece;
  },

  async update(id: string, updates: Partial<Piece>): Promise<Piece> {
    let merged: Partial<Piece> = { ...updates };
    if (updates.compatibleMachineIds) {
      merged = { ...updates, compat: await resolvePieceCompat(updates.compatibleMachineIds) };
    }
    if (isApiEnabled()) {
      const row = await apiRequest<PieceRow>('pecas', 'update', { id, body: pieceToRow(merged) });
      return rowToPiece(row);
    }
    localUpdate('pieces', id, merged);
    return localGet('pieces', id) as Piece;
  },

  async remove(id: string): Promise<void> {
    if (isApiEnabled()) { await apiRequest('pecas', 'delete', { id }); return; }
    localRemove('pieces', id);
  },

  async removeMany(ids: string[]): Promise<void> {
    if (isApiEnabled()) { await Promise.all(ids.map((id) => apiRequest('pecas', 'delete', { id }))); return; }
    localRemoveMany('pieces', ids);
  },
};

// ---------------------------------------------------------------------------
// Fluxos
// ---------------------------------------------------------------------------

export const flowsApi = {
  async list(): Promise<Flow[]> {
    if (isApiEnabled()) return (await apiRequest<FlowRow[]>('fluxos', 'list')).map(rowToFlow);
    return localList('flows') as Flow[];
  },

  async get(id: string): Promise<Flow> {
    if (isApiEnabled()) return rowToFlow(await apiRequest<FlowRow>('fluxos', 'get', { id }));
    return localGet('flows', id) as Flow;
  },

  async create(f: Partial<Flow> & { name: string }): Promise<Flow> {
    const existing = await flowsApi.list();
    const existingVersions = existing.filter((fl) => fl.code === f.code || fl.product === f.product).length;
    const flow: Flow = {
      ...f,
      date: f.date || nowDate(),
      ver: f.ver || `V${existingVersions + 1}`,
      createdBy: f.createdBy || getUser(),
      createdAt: nowISO(),
      updatedBy: getUser(),
      updatedAt: nowISO(),
    } as Flow;
    if (isApiEnabled()) {
      const row = await apiRequest<FlowRow>('fluxos', 'create', { body: flowToRow({ ...flow, id: undefined }) });
      return rowToFlow(row);
    }
    return localCreate('flows', { ...flow, id: f.id ?? uid('flow') }) as Flow;
  },

  async duplicate(id: string): Promise<Flow | undefined> {
    const flows = await flowsApi.list();
    const target = flows.find((f) => f.id === id);
    if (!target) return undefined;
    const existing = flows.filter((fl) => fl.code === target.code).length;
    return flowsApi.create({
      ...target,
      date: nowDate(),
      ver: `V${existing + 1}`,
    });
  },

  async update(id: string, updates: Partial<Flow>): Promise<Flow> {
    if (isApiEnabled()) {
      const row = await apiRequest<FlowRow>('fluxos', 'update', { id, body: flowToRow({ ...updates, updatedBy: getUser(), updatedAt: nowISO() }) });
      return rowToFlow(row);
    }
    localUpdate('flows', id, { ...updates, updatedBy: getUser(), updatedAt: nowISO() });
    return localGet('flows', id) as Flow;
  },

  async remove(id: string): Promise<void> {
    if (isApiEnabled()) { await apiRequest('fluxos', 'delete', { id }); return; }
    localRemove('flows', id);
  },

  async removeMany(ids: string[]): Promise<void> {
    if (isApiEnabled()) { await Promise.all(ids.map((id) => apiRequest('fluxos', 'delete', { id }))); return; }
    localRemoveMany('flows', ids);
  },
};

// ---------------------------------------------------------------------------
// Formatos
// ---------------------------------------------------------------------------

export const formatosApi = {
  async list(): Promise<Formato[]> {
    if (isApiEnabled()) return (await apiRequest<FormatoRow[]>('formatos', 'list')).map(rowToFormato);
    return localList('formatos') as Formato[];
  },

  async get(id: string): Promise<Formato> {
    if (isApiEnabled()) return rowToFormato(await apiRequest<FormatoRow>('formatos', 'get', { id }));
    return localGet('formatos', id) as Formato;
  },

  async create(input: Partial<Formato>): Promise<Formato> {
    const formato: Formato = {
      ...input,
      createdAt: input.createdAt ?? nowDate(),
      createdBy: input.createdBy ?? getUser(),
    } as Formato;
    if (isApiEnabled()) {
      const row = await apiRequest<FormatoRow>('formatos', 'create', { body: formatoToRow({ ...formato, id: undefined }) });
      return rowToFormato(row);
    }
    return localCreate('formatos', { ...formato, id: input.id ?? uid('fmt') }) as Formato;
  },

  async update(id: string, updates: Partial<Formato>): Promise<Formato> {
    if (isApiEnabled()) {
      const row = await apiRequest<FormatoRow>('formatos', 'update', { id, body: formatoToRow({ ...updates, updatedBy: getUser(), updatedAt: nowISO() }) });
      return rowToFormato(row);
    }
    localUpdate('formatos', id, { ...updates, updatedBy: getUser(), updatedAt: nowISO() });
    return localGet('formatos', id) as Formato;
  },

  async remove(id: string): Promise<void> {
    if (isApiEnabled()) { await apiRequest('formatos', 'delete', { id }); return; }
    localRemove('formatos', id);
  },

  async removeMany(ids: string[]): Promise<void> {
    if (isApiEnabled()) { await Promise.all(ids.map((id) => apiRequest('formatos', 'delete', { id }))); return; }
    localRemoveMany('formatos', ids);
  },
};

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

interface ConfiguracoesRow {
  id: string;
  chave?: unknown;
  valor?: unknown;
  descricao?: unknown;
}

const CONFIG_ROW_KEY = 'app_config';

export const configApi = {
  async get(): Promise<Config> {
    if (isApiEnabled()) {
      const rows = await apiRequest<ConfiguracoesRow[]>('configuracoes', 'list');
      const row = rows.find((r) => r.chave === CONFIG_ROW_KEY);
      if (!row?.valor) return { uoConfigs: {} };
      try {
        return JSON.parse(String(row.valor)) as Config;
      } catch {
        return { uoConfigs: {} };
      }
    }
    return getStorage().config;
  },

  async update(updates: Partial<Config>): Promise<Config> {
    if (isApiEnabled()) {
      const current = await configApi.get();
      const next: Config = { ...current, ...updates };
      const rows = await apiRequest<ConfiguracoesRow[]>('configuracoes', 'list');
      const existing = rows.find((r) => r.chave === CONFIG_ROW_KEY);
      if (existing) {
        await apiRequest('configuracoes', 'update', { id: existing.id, body: { valor: JSON.stringify(next) } });
      } else {
        await apiRequest('configuracoes', 'create', { body: { chave: CONFIG_ROW_KEY, valor: JSON.stringify(next), descricao: 'Configuração da aplicação.' } });
      }
      return next;
    }
    updateStorageEntity('config', (config) => ({ ...config, ...updates }));
    return getStorage().config;
  },
};

// ---------------------------------------------------------------------------
// Export / Import
// ---------------------------------------------------------------------------

const EXPORT_ENTITIES: Array<{ entity: DbEntityName; key: StorageDataKey; api: { list: () => Promise<unknown[]> } }> = [
  { entity: 'maquinas', key: 'machines', api: machinesApi },
  { entity: 'produtos', key: 'products', api: productsApi },
  { entity: 'pecas', key: 'pieces', api: piecesApi },
  { entity: 'fluxos', key: 'flows', api: flowsApi },
  { entity: 'formatos', key: 'formatos', api: formatosApi },
];

export const exportApi = {
  async exportAll(): Promise<StorageData> {
    if (isApiEnabled()) {
      const entries = await Promise.all(
        EXPORT_ENTITIES.map(async (e) => [e.key, await e.api.list()] as const),
      );
      const data = Object.fromEntries(entries) as Pick<StorageData, 'machines' | 'products' | 'pieces' | 'flows' | 'formatos'>;
      return { ...data, history: [], config: await configApi.get() };
    }
    return getStorage();
  },

  async importAll(imported: unknown): Promise<number> {
    const data = imported as Record<string, unknown>;
    let total = 0;

    if (isApiEnabled()) {
      for (const e of EXPORT_ENTITIES) {
        const items = data[e.key];
        if (!Array.isArray(items)) continue;
        const existing = await apiRequest<Array<{ id: string }>>(e.entity, 'list');
        await Promise.all(existing.map((row) => apiRequest(e.entity, 'delete', { id: row.id })));
        for (const item of items) {
          await apiRequest(e.entity, 'create', { body: domainToRow(e.entity, item) });
        }
        total += items.length;
      }
      return total;
    }

    for (const e of EXPORT_ENTITIES) {
      const items = data[e.key];
      if (!Array.isArray(items)) continue;
      const newItems = items.map((item) => ({ ...(item as Record<string, unknown>), id: uid(e.key.slice(0, 3)) }));
      updateStorageEntity(e.key, () => newItems as never[]);
      total += newItems.length;
    }
    return total;
  },
};
