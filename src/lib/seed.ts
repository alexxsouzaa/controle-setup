import { fsList, fsCreate } from './api/firestore';
import { nowDate, getUser } from './api/client';
import type { Unit, Line, Machine, Product, Piece, Formato, Flow, ResourceScope } from '../types';

export interface SeedReport {
  units: number;
  lines: number;
  machines: number;
  products: number;
  pieces: number;
  formatos: number;
  flows: number;
}

const today = nowDate();

function unitRecord(code: string, name: string, description: string): Partial<Unit> {
  return { code, name, description, status: 'active', createdAt: today, createdBy: getUser() };
}

function lineRecord(unitId: string, name: string): Partial<Line> {
  return { name, unitId, status: 'active', machineIds: [], createdAt: today, createdBy: getUser() };
}

function machineRecord(unit: Unit, name: string, lines: string[], toolingCategories: string[]): Partial<Machine> {
  return {
    name,
    uo: unit.name,
    unitId: unit.id,
    scope: 'unit' as ResourceScope,
    lines,
    type: 'Envasadora',
    toolingCategories,
    createdAt: today,
    createdBy: getUser(),
  };
}

function productRecord(unit: Unit | null, code: string, name: string, category: string, vol: number, unitLabel: string, formato: string): Partial<Product> {
  return {
    code,
    name,
    category,
    vol,
    unit: unitLabel,
    volume: vol,
    volumeUnit: unitLabel,
    formato,
    scope: unit ? ('unit' as ResourceScope) : ('global' as ResourceScope),
    unitId: unit?.id,
    created: today,
    createdAt: today,
  };
}

function pieceRecord(
  unit: Unit,
  machineIds: string[],
  machineNames: string[],
  name: string,
  category: string,
  specification: string,
  extra: Partial<Piece>,
): Partial<Piece> {
  return {
    name,
    category,
    specification,
    code: '',
    compat: machineNames.join(', '),
    compatibleMachineIds: machineIds,
    stock: 5,
    min: 1,
    unit: 'un',
    location: '',
    scope: 'unit' as ResourceScope,
    unitId: unit.id,
    createdAt: today,
    createdBy: getUser(),
    ...extra,
  };
}

function flowRecord(machine: Machine, product: Product, line: string, pieces: Piece[]): Partial<Flow> {
  const tooling = pieces.map((p) => ({
    pieceId: p.id,
    pieceName: p.name,
    pieceCode: p.code || '',
    pieceCategory: p.category,
    isPrimary: true,
    image: p.image || '',
    group: p.category,
  }));
  return {
    name: `${product.code} - ${product.name.toUpperCase()} - V1`,
    machine: machine.name,
    machineId: machine.id,
    unitId: machine.unitId || '',
    line,
    product: product.name,
    productId: product.id,
    code: product.code,
    vol: `${product.vol} ${product.unit || 'ml'}`,
    date: today,
    ver: 'V1',
    status: 'Concluído',
    parts: { primary: tooling, alternative: [] },
    tooling,
    toolingCount: tooling.length,
    toolingTotal: tooling.length,
    createdBy: getUser(),
    createdAt: today,
  };
}

function formatoRecord(unit: Unit, machine: Machine, product: Product, pieces: Piece[], formatType: string): Partial<Formato> {
  const fmtPieces = pieces.map((p) => ({ pieceId: p.id, pieceName: p.name, pieceCode: p.code || '', pieceCategory: p.category }));
  return {
    name: `${unit.name.toUpperCase()} - ${product.category.toUpperCase()} - ${formatType} - ${product.vol}${product.unit || 'ml'}`,
    formatType,
    tipo: formatType,
    uo: unit.name,
    unitId: unit.id,
    scope: 'unit' as ResourceScope,
    category: product.category,
    diameter: 40,
    volume: product.vol || 0,
    volumeUnit: product.unit || 'ml',
    machineId: machine.id,
    partIds: pieces.map((p) => p.id),
    alternativePartIds: [],
    pieces: fmtPieces,
    createdBy: getUser(),
    createdAt: today,
  };
}

/**
 * Popula o sistema com dados de exemplo (UOs, linhas, máquinas, produtos,
 * peças, formatos e fluxos). É idempotente: registros que já existem
 * (mesmo nome/código) não são duplicados.
 */
export async function seedDemoData(): Promise<SeedReport> {
  const report: SeedReport = { units: 0, lines: 0, machines: 0, products: 0, pieces: 0, formatos: 0, flows: 0 };

  const [existingUnits, existingLines, existingMachines, existingProducts, existingPieces, existingFormatos, existingFlows] = await Promise.all([
    fsList<Unit>('units'),
    fsList<Line>('lines'),
    fsList<Machine>('machines'),
    fsList<Product>('products'),
    fsList<Piece>('pieces'),
    fsList<Formato>('formatos'),
    fsList<Flow>('flows'),
  ]);

  const unitByName = new Map(existingUnits.map((u) => [u.name.trim().toLowerCase(), u] as [string, Unit]));
  const lineByKey = new Set(existingLines.map((l) => `${l.unitId}:${l.name.trim().toLowerCase()}`));
  const machineByName = new Set(existingMachines.map((m) => m.name.trim().toLowerCase()));
  const productByCode = new Set(existingProducts.map((p) => p.code.trim().toLowerCase()));
  const pieceByName = new Set(existingPieces.map((p) => p.name.trim().toLowerCase()));
  const formatoByName = new Set(existingFormatos.map((f) => (f.name || '').trim().toLowerCase()));
  const flowByName = new Set(existingFlows.map((f) => f.name.trim().toLowerCase()));

  const createUnit = async (code: string, name: string, description: string): Promise<Unit | null> => {
    const key = name.trim().toLowerCase();
    if (unitByName.has(key)) {
      const existing = existingUnits.find((u) => u.name.trim().toLowerCase() === key);
      return existing ?? null;
    }
    const created = await fsCreate<Unit>('units', unitRecord(code, name, description) as Unit);
    if (created) unitByName.set(key, created);
    report.units += 1;
    return created;
  };

  const sp = await createUnit('UO-01', 'UO São Paulo', 'Planta principal — envasamento de cosméticos');
  const cp = await createUnit('UO-02', 'UO Campinas', 'Planta secundária — produtos capilares');

  const units = [sp, cp].filter((u): u is Unit => !!u);
  const unitMachines: Record<string, Machine[]> = {};
  const unitPieces: Record<string, Piece[]> = {};

  for (const unit of units) {
    unitMachines[unit.id] = [];
    unitPieces[unit.id] = [];

    for (const lineName of ['Linha 01', 'Linha 02']) {
      const key = `${unit.id}:${lineName.trim().toLowerCase()}`;
      if (lineByKey.has(key)) continue;
      await fsCreate<Line>('lines', lineRecord(unit.id, lineName) as Line);
      lineByKey.add(key);
      report.lines += 1;
    }

    const machineDefs: Array<[string, string[], string[]]> = unit === sp
      ? [
          ['Envasadora SP-01', ['Linha 01', 'Linha 02'], ['Bico de Envase', 'Faca', 'Mordente', 'Copo', 'Ponteira do Empurrador']],
          ['Rótula SP-02', ['Linha 01'], ['Estação de Limpeza', 'Berço']],
        ]
      : [
          ['Envasadora CP-01', ['Linha 01', 'Linha 02'], ['Bico de Envase', 'Faca', 'Mordente', 'Copo', 'Ponteira do Empurrador']],
          ['Embaladora CP-02', ['Linha 02'], ['Camisa do Bico de Ar Quente', 'Suporte do Camisa do Bico de Ar Quente']],
        ];

    for (const [mName, mLines, tooling] of machineDefs) {
      if (machineByName.has(mName.trim().toLowerCase())) continue;
      const machine = await fsCreate<Machine>('machines', machineRecord(unit, mName, mLines, tooling) as Machine);
      machineByName.add(mName.trim().toLowerCase());
      unitMachines[unit.id].push(machine);
      report.machines += 1;
    }
  }

  for (const unit of units) {
    const machineIds = unitMachines[unit.id].map((m) => m.id);
    const machineNames = unitMachines[unit.id].map((m) => m.name);
    const pieceDefs: Array<[string, string, string, Partial<Piece>]> = unit === sp
      ? [
          ['Bico de Envase 250mm', 'Bico de Envase', '250 mm', { diameterMin: 30, diameterMax: 50 }],
          ['Faca de Corte Serrilhada', 'Faca', 'Serrilhada', { sealingType: 'serrilhada' }],
          ['Mordente Lisa', 'Mordente', 'Lisa', { sealingType: 'lisa' }],
          ['Copo 40mm', 'Copos', '40 mm', { diameterMin: 35, diameterMax: 45 }],
          ['Ponteira do Empurrador 30mm', 'Ponteira do Empurrador', '30 mm', { diameterMin: 25, diameterMax: 35 }],
        ]
      : [
          ['Bico de Envase 300mm', 'Bico de Envase', '300 mm', { diameterMin: 40, diameterMax: 60 }],
          ['Faca de Corte Lisa', 'Faca', 'Lisa', { sealingType: 'lisa' }],
          ['Mordente Serrilhada', 'Mordente', 'Serrilhada', { sealingType: 'serrilhada' }],
          ['Copo 50mm', 'Copos', '50 mm', { diameterMin: 45, diameterMax: 55 }],
          ['Camisa do Bico de Ar Quente 60mm', 'Camisa do Bico de Ar Quente', '60 mm', { diameterMin: 55, diameterMax: 65, sealingType: 'padrão' }],
        ];

    for (const [name, category, spec, extra] of pieceDefs) {
      if (pieceByName.has(name.trim().toLowerCase())) continue;
      const piece = await fsCreate<Piece>('pieces', pieceRecord(unit, machineIds, machineNames, name, category, spec, extra) as Piece);
      pieceByName.add(name.trim().toLowerCase());
      unitPieces[unit.id].push(piece);
      report.pieces += 1;
    }
  }

  const productDefs: Array<[Unit | null, string, string, string, number, string, string]> = [
    [sp, 'SHP-400-001', 'Shampoo Nutritivo', 'Shampoo', 400, 'ml', 'Reto'],
    [sp, 'CDD-250-002', 'Condicionador Reparador', 'Condicionador', 250, 'ml', 'Boomerang'],
    [cp, 'SHP-200-003', 'Shampoo Anticaspa', 'Shampoo', 200, 'ml', 'Reto'],
    [null, 'GLB-100-001', 'Sérum Capilar', 'Sérum', 100, 'ml', 'Transforms'],
  ];
  const seededProducts: Product[] = [];
  for (const [unit, code, name, category, vol, unitLabel, formato] of productDefs) {
    if (productByCode.has(code.trim().toLowerCase())) continue;
    const product = await fsCreate<Product>('products', productRecord(unit, code, name, category, vol, unitLabel, formato) as Product);
    productByCode.add(code.trim().toLowerCase());
    seededProducts.push(product);
    report.products += 1;
  }

  for (const unit of units) {
    const machines = unitMachines[unit.id];
    const pieces = unitPieces[unit.id];
    if (machines.length === 0 || pieces.length === 0) continue;
    const products = seededProducts.filter((p) => p.unitId === unit.id);
    if (products.length === 0) continue;

    const machine = machines[0];
    const line = (machine.lines || [machine.line || ''])[0] || 'Linha 01';
    const product = products[0];

    const formatoName = `${unit.name.toUpperCase()} - ${product.category.toUpperCase()} - FRASCO CILÍNDRICO - ${product.vol}${product.unit || 'ml'}`;
    if (!formatoByName.has(formatoName.trim().toLowerCase())) {
      await fsCreate<Formato>('formatos', formatoRecord(unit, machine, product, pieces, 'Frasco cilíndrico') as Formato);
      formatoByName.add(formatoName.trim().toLowerCase());
      report.formatos += 1;
    }

    const flowName = `${product.code} - ${product.name.toUpperCase()} - V1`;
    if (!flowByName.has(flowName.trim().toLowerCase())) {
      await fsCreate<Flow>('flows', flowRecord(machine, product, line, pieces) as Flow);
      flowByName.add(flowName.trim().toLowerCase());
      report.flows += 1;
    }
  }

  return report;
}
