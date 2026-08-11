import { fsList, fsGet, fsCreate, fsUpdate, fsRemove, fsRemoveMany, fsReplaceAll, fsGetConfig, fsUpdateConfig } from './firestore';
import { nowDate, nowISO, getUser } from './client';
import type { Machine, Product, Piece, Flow, Formato, Config, Unit, Line } from '../../types';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Unidades Organizacionais (UO)
// ---------------------------------------------------------------------------

export const unitsApi = {
  async list(): Promise<Unit[]> {
    return fsList<Unit>('units');
  },

  async get(id: string): Promise<Unit> {
    return fsGet<Unit>('units', id);
  },

  async create(input: Partial<Unit> & { code: string; name: string }): Promise<Unit> {
    const unit: Unit = {
      ...input,
      status: input.status ?? 'active',
      createdAt: input.createdAt ?? nowDate(),
      createdBy: input.createdBy ?? getUser(),
    } as Unit;
    return fsCreate<Unit>('units', unit);
  },

  async update(id: string, updates: Partial<Unit>): Promise<Unit> {
    await fsUpdate('units', id, updates);
    return fsGet<Unit>('units', id);
  },

  async remove(id: string): Promise<void> {
    await fsRemove('units', id);
  },

  async removeMany(ids: string[]): Promise<void> {
    await fsRemoveMany('units', ids);
  },
};

// ---------------------------------------------------------------------------
// Linhas
// ---------------------------------------------------------------------------

export const linesApi = {
  async list(): Promise<Line[]> {
    return fsList<Line>('lines');
  },

  async get(id: string): Promise<Line> {
    return fsGet<Line>('lines', id);
  },

  async create(input: Partial<Line> & { name: string; unitId: string }): Promise<Line> {
    const line: Line = {
      ...input,
      machineIds: input.machineIds ?? [],
      status: input.status ?? 'active',
      createdAt: input.createdAt ?? nowDate(),
      createdBy: input.createdBy ?? getUser(),
    } as Line;
    return fsCreate<Line>('lines', line);
  },

  async update(id: string, updates: Partial<Line>): Promise<Line> {
    await fsUpdate('lines', id, updates);
    return fsGet<Line>('lines', id);
  },

  async remove(id: string): Promise<void> {
    await fsRemove('lines', id);
  },

  async removeMany(ids: string[]): Promise<void> {
    await fsRemoveMany('lines', ids);
  },
};

// ---------------------------------------------------------------------------
// Máquinas
// ---------------------------------------------------------------------------

export const machinesApi = {
  async list(): Promise<Machine[]> {
    return fsList<Machine>('machines');
  },

  async get(id: string): Promise<Machine> {
    return fsGet<Machine>('machines', id);
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
    return fsCreate<Machine>('machines', machine);
  },

  async update(id: string, updates: Partial<Machine>): Promise<Machine> {
    await fsUpdate('machines', id, { ...updates, updatedAt: nowDate() });
    return fsGet<Machine>('machines', id);
  },

  async remove(id: string): Promise<void> {
    await fsRemove('machines', id);
  },

  async removeMany(ids: string[]): Promise<void> {
    await fsRemoveMany('machines', ids);
  },
};

// ---------------------------------------------------------------------------
// Produtos
// ---------------------------------------------------------------------------

export const productsApi = {
  async list(): Promise<Product[]> {
    return fsList<Product>('products');
  },

  async get(id: string): Promise<Product> {
    return fsGet<Product>('products', id);
  },

  async create(input: Partial<Product> & { name: string; code: string; category: string }): Promise<Product> {
    const product: Product = {
      ...input,
      createdAt: input.createdAt ?? nowDate(),
    } as Product;
    return fsCreate<Product>('products', product);
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    await fsUpdate('products', id, updates);
    return fsGet<Product>('products', id);
  },

  async remove(id: string): Promise<void> {
    await fsRemove('products', id);
  },

  async removeMany(ids: string[]): Promise<void> {
    await fsRemoveMany('products', ids);
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
    return fsList<Piece>('pieces');
  },

  async get(id: string): Promise<Piece> {
    return fsGet<Piece>('pieces', id);
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
    return fsCreate<Piece>('pieces', piece);
  },

  async update(id: string, updates: Partial<Piece>): Promise<Piece> {
    let merged: Partial<Piece> = { ...updates };
    if (updates.compatibleMachineIds) {
      merged = { ...updates, compat: await resolvePieceCompat(updates.compatibleMachineIds) };
    }
    await fsUpdate('pieces', id, merged);
    return fsGet<Piece>('pieces', id);
  },

  async remove(id: string): Promise<void> {
    await fsRemove('pieces', id);
  },

  async removeMany(ids: string[]): Promise<void> {
    await fsRemoveMany('pieces', ids);
  },
};

// ---------------------------------------------------------------------------
// Fluxos
// ---------------------------------------------------------------------------

export const flowsApi = {
  async list(): Promise<Flow[]> {
    return fsList<Flow>('flows');
  },

  async get(id: string): Promise<Flow> {
    return fsGet<Flow>('flows', id);
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
    return fsCreate<Flow>('flows', flow);
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
    await fsUpdate('flows', id, { ...updates, updatedBy: getUser(), updatedAt: nowISO() });
    return fsGet<Flow>('flows', id);
  },

  async remove(id: string): Promise<void> {
    await fsRemove('flows', id);
  },

  async removeMany(ids: string[]): Promise<void> {
    await fsRemoveMany('flows', ids);
  },
};

// ---------------------------------------------------------------------------
// Formatos
// ---------------------------------------------------------------------------

export const formatosApi = {
  async list(): Promise<Formato[]> {
    return fsList<Formato>('formatos');
  },

  async get(id: string): Promise<Formato> {
    return fsGet<Formato>('formatos', id);
  },

  async create(input: Partial<Formato>): Promise<Formato> {
    const formato: Formato = {
      ...input,
      createdAt: input.createdAt ?? nowDate(),
      createdBy: input.createdBy ?? getUser(),
    } as Formato;
    return fsCreate<Formato>('formatos', formato);
  },

  async update(id: string, updates: Partial<Formato>): Promise<Formato> {
    await fsUpdate('formatos', id, { ...updates, updatedBy: getUser(), updatedAt: nowISO() });
    return fsGet<Formato>('formatos', id);
  },

  async remove(id: string): Promise<void> {
    await fsRemove('formatos', id);
  },

  async removeMany(ids: string[]): Promise<void> {
    await fsRemoveMany('formatos', ids);
  },
};

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

export const configApi = {
  async get(): Promise<Config> {
    return fsGetConfig();
  },

  async update(updates: Partial<Config>): Promise<Config> {
    return fsUpdateConfig(updates);
  },
};

// ---------------------------------------------------------------------------
// Import / Export
// ---------------------------------------------------------------------------

const EXPORT_ENTITIES = [
  { key: 'units', api: unitsApi },
  { key: 'lines', api: linesApi },
  { key: 'machines', api: machinesApi },
  { key: 'products', api: productsApi },
  { key: 'pieces', api: piecesApi },
  { key: 'flows', api: flowsApi },
  { key: 'formatos', api: formatosApi },
] as const;

export const exportApi = {
  async importAll(imported: unknown): Promise<number> {
    const root = z.record(z.string(), z.unknown()).safeParse(imported);
    if (!root.success) throw new Error('Arquivo de importação inválido (esperado um objeto JSON).');
    const data = root.data;

    // Esquema permissivo por entidade: cada item deve ser um objeto (record).
    // Rejeita primitivos, arrays aninhados e null, preservando campos legados/extras.
    const itemsSchema = z.array(z.record(z.string(), z.unknown()));

    let total = 0;
    for (const e of EXPORT_ENTITIES) {
      const raw = data[e.key];
      if (raw === undefined) continue;
      const parsed = itemsSchema.safeParse(raw);
      if (!parsed.success) {
        throw new Error(`Importação: "${e.key}" deve ser uma lista de objetos.`);
      }
      total += await fsReplaceAll(e.key, parsed.data);
    }
    if (data.config && typeof data.config === 'object') {
      await fsUpdateConfig(data.config as Partial<Config>);
    }
    return total;
  },
};
