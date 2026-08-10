import { fsList, fsCreate, fsUpdateMany } from './api/firestore';
import { nowDate, getUser } from './api/client';
import type { Unit, Machine, Formato, Flow, Product, Piece } from '../types';

export interface MigrationReport {
  unitsCreated: string[];
  machinesUpdated: number;
  formatosUpdated: number;
  flowsUpdated: number;
}

export interface OrphanReport {
  productsAssigned: number;
  piecesAssigned: number;
}

/**
 * Migra dados legados para o modelo Multi-UO:
 *
 * - Cria UOs a partir dos valores distintos do campo legado `uo`
 *   (máquinas e formatos) que ainda não possuem UO correspondente.
 * - Atribui `unitId` às máquinas e formatos com `uo` mas sem `unitId`.
 * - Atribui `unitId` aos fluxos cuja máquina (id ou nome) pertence a uma UO.
 *
 * Produtos e peças não possuem vínculo legado com UO; use
 * `assignOrphanedToUnit` para atribuí-los em massa.
 */
export async function migrateLegacyData(): Promise<MigrationReport> {
  const [machines, formatos, flows, units] = await Promise.all([
    fsList<Machine>('machines'),
    fsList<Formato>('formatos'),
    fsList<Flow>('flows'),
    fsList<Unit>('units'),
  ]);

  const report: MigrationReport = { unitsCreated: [], machinesUpdated: 0, formatosUpdated: 0, flowsUpdated: 0 };

  const unitByName = new Map(units.map((u) => [u.name.trim().toLowerCase(), u]));

  const ensureUnit = async (name: string): Promise<string | null> => {
    const key = name.trim().toLowerCase();
    if (!key) return null;
    const existing = unitByName.get(key);
    if (existing) return existing.id;
    const created = await fsCreate<Unit>('units', {
      code: name.trim().slice(0, 10).toUpperCase().replace(/\s+/g, '-'),
      name: name.trim(),
      description: 'Criada automaticamente na migração de dados legados.',
      status: 'active',
      createdAt: nowDate(),
      createdBy: getUser(),
    } as Unit);
    unitByName.set(key, created);
    report.unitsCreated.push(created.name);
    return created.id;
  };

  const machineUpdates: Array<{ id: string; updates: Record<string, unknown> }> = [];
  const formatoUpdates: Array<{ id: string; updates: Record<string, unknown> }> = [];

  for (const m of machines) {
    if (m.unitId) continue;
    const unitId = await ensureUnit(m.uo || '');
    if (!unitId) continue;
    machineUpdates.push({ id: m.id, updates: { unitId, scope: 'unit', uo: m.uo } });
  }

  for (const f of formatos) {
    if (f.unitId) continue;
    const unitId = await ensureUnit(f.uo || '');
    if (!unitId) continue;
    formatoUpdates.push({ id: f.id, updates: { unitId, scope: 'unit', uo: f.uo } });
  }

  const machineById = new Map(machines.map((m) => [m.id, m]));
  const machineByName = new Map(machines.map((m) => [m.name.trim().toLowerCase(), m]));
  const unitIdByMachine = new Map(machines.map((m) => [m.id, m.unitId || '']));
  machineUpdates.forEach((u) => unitIdByMachine.set(u.id, u.updates.unitId as string));

  const flowUpdates: Array<{ id: string; updates: Record<string, unknown> }> = [];
  for (const f of flows) {
    if (f.unitId) continue;
    const machine = (f.machineId && machineById.get(f.machineId)) || machineByName.get((f.machine || '').trim().toLowerCase());
    const unitId = machine ? (unitIdByMachine.get(machine.id) || '') : '';
    if (!unitId) continue;
    flowUpdates.push({ id: f.id, updates: { unitId } });
  }

  if (machineUpdates.length > 0) {
    await fsUpdateMany('machines', machineUpdates);
    report.machinesUpdated = machineUpdates.length;
  }
  if (formatoUpdates.length > 0) {
    await fsUpdateMany('formatos', formatoUpdates);
    report.formatosUpdated = formatoUpdates.length;
  }
  if (flowUpdates.length > 0) {
    await fsUpdateMany('flows', flowUpdates);
    report.flowsUpdated = flowUpdates.length;
  }

  return report;
}

/**
 * Atribui em massa produtos e/ou peças que ainda não possuem UO (`unitId`)
 * à unidade informada. Recursos com `scope === 'global'` são preservados.
 */
export async function assignOrphanedToUnit(
  unitId: string,
  options: { products: boolean; pieces: boolean },
): Promise<OrphanReport> {
  const report: OrphanReport = { productsAssigned: 0, piecesAssigned: 0 };

  if (options.products) {
    const products = await fsList<Product>('products');
    const orphaned = products.filter((p) => !p.unitId && p.scope !== 'global');
    if (orphaned.length > 0) {
      await fsUpdateMany('products', orphaned.map((p) => ({ id: p.id, updates: { unitId, scope: 'unit' } })));
      report.productsAssigned = orphaned.length;
    }
  }

  if (options.pieces) {
    const pieces = await fsList<Piece>('pieces');
    const orphaned = pieces.filter((p) => !p.unitId && p.scope !== 'global');
    if (orphaned.length > 0) {
      await fsUpdateMany('pieces', orphaned.map((p) => ({ id: p.id, updates: { unitId, scope: 'unit' } })));
      report.piecesAssigned = orphaned.length;
    }
  }

  return report;
}
