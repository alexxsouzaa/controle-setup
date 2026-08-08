import type { Machine, Product, Piece, Flow, FlowPart, Formato } from '../../types';

// Converte valores vindos do Google Planilhas (números podem chegar como texto).
function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function toStringOrEmpty(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function toStringOrUndef(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  return String(value);
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'object') return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Máquinas
// ---------------------------------------------------------------------------

export interface MachineRow {
  id?: string;
  nome?: unknown;
  uo?: unknown;
  linha?: unknown;
  linhas?: unknown;
  tipo?: unknown;
  outils?: unknown;
  categorias_ferramentais?: unknown;
  imagem?: unknown;
  notas?: unknown;
  ativo?: unknown;
  created_by?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}

export function rowToMachine(row: MachineRow): Machine {
  const lines = parseJsonArray(row.linhas);
  const toolingCategories = parseJsonArray(row.categorias_ferramentais);
  const image = toStringOrUndef(row.imagem);
  return {
    id: toStringOrEmpty(row.id),
    name: toStringOrEmpty(row.nome),
    line: toStringOrEmpty(row.linha) || lines[0] || '',
    lines,
    uo: toStringOrEmpty(row.uo),
    type: toStringOrUndef(row.tipo),
    outils: toNumber(row.outils),
    toolingCategories,
    ferramentais: toolingCategories,
    image,
    photo: image,
    notes: toStringOrUndef(row.notas),
    createdBy: toStringOrUndef(row.created_by),
    createdAt: toStringOrEmpty(row.created_at),
    updatedAt: toStringOrUndef(row.updated_at),
  };
}

export function machineToRow(m: Partial<Machine>): MachineRow {
  const lines = m.lines?.length ? m.lines : m.line ? [m.line] : [];
  const cats = m.toolingCategories?.length ? m.toolingCategories : m.ferramentais;
  const image = m.image ?? m.photo;
  return {
    id: m.id ?? undefined,
    nome: m.name ?? '',
    uo: m.uo ?? '',
    linha: m.line,
    linhas: lines.length ? JSON.stringify(lines) : '',
    tipo: m.type,
    outils: m.outils,
    categorias_ferramentais: cats?.length ? JSON.stringify(cats) : '',
    imagem: image,
    notas: m.notes,
    ativo: true,
    created_by: m.createdBy,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Produtos
// ---------------------------------------------------------------------------

export interface ProductRow {
  id?: string;
  codigo?: unknown;
  nome?: unknown;
  categoria?: unknown;
  familia?: unknown;
  volumetria?: unknown;
  unidade?: unknown;
  embalagem?: unknown;
  peso?: unknown;
  imagem?: unknown;
  tipo_formato?: unknown;
  notas?: unknown;
  created_by?: unknown;
  created_at?: unknown;
}

export function rowToProduct(row: ProductRow): Product {
  const vol = toNumber(row.volumetria);
  const unit = toStringOrUndef(row.unidade);
  const image = toStringOrUndef(row.imagem);
  const createdAt = toStringOrUndef(row.created_at);
  return {
    id: toStringOrEmpty(row.id),
    code: toStringOrEmpty(row.codigo),
    name: toStringOrEmpty(row.nome),
    category: toStringOrEmpty(row.categoria),
    family: toStringOrUndef(row.familia),
    vol,
    volume: vol,
    unit,
    volumeUnit: unit,
    packaging: toStringOrUndef(row.embalagem),
    weight: toStringOrUndef(row.peso),
    image,
    photo: image,
    formatType: toStringOrUndef(row.tipo_formato),
    notes: toStringOrUndef(row.notas),
    created: createdAt,
    createdAt,
  };
}

export function productToRow(p: Partial<Product>): ProductRow {
  const image = p.image ?? p.photo;
  return {
    id: p.id ?? undefined,
    codigo: p.code ?? '',
    nome: p.name ?? '',
    categoria: p.category ?? '',
    familia: p.family,
    volumetria: p.vol ?? p.volume,
    unidade: p.unit ?? p.volumeUnit,
    embalagem: p.packaging,
    peso: p.weight,
    imagem: image,
    tipo_formato: p.formatType,
    notas: p.notes,
    created_at: p.createdAt ?? p.created,
  };
}

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

export interface PieceRow {
  id?: string;
  codigo?: unknown;
  nome?: unknown;
  categoria_id?: unknown;
  categoria?: unknown;
  referencia?: unknown;
  compat?: unknown;
  maquinas?: unknown;
  localizacao?: unknown;
  estoque?: unknown;
  estoque_minimo?: unknown;
  unidade?: unknown;
  selagem?: unknown;
  diametro_min?: unknown;
  diametro_max?: unknown;
  imagem?: unknown;
  created_by?: unknown;
  created_at?: unknown;
}

export function rowToPiece(row: PieceRow): Piece {
  const image = toStringOrUndef(row.imagem);
  return {
    id: toStringOrEmpty(row.id),
    code: toStringOrEmpty(row.codigo),
    name: toStringOrEmpty(row.nome),
    category: toStringOrEmpty(row.categoria) || toStringOrEmpty(row.categoria_id),
    specification: toStringOrUndef(row.referencia),
    compat: toStringOrEmpty(row.compat),
    compatibleMachineIds: parseJsonArray(row.maquinas),
    location: toStringOrEmpty(row.localizacao),
    stock: toNumber(row.estoque) ?? 0,
    min: toNumber(row.estoque_minimo) ?? 0,
    unit: toStringOrEmpty(row.unidade),
    image,
    imageUrl: image,
    createdBy: toStringOrUndef(row.created_by),
    createdAt: toStringOrUndef(row.created_at),
    sealingType: toStringOrUndef(row.selagem),
    diameterMin: toNumber(row.diametro_min),
    diameterMax: toNumber(row.diametro_max),
  };
}

export function pieceToRow(p: Partial<Piece>): PieceRow {
  const image = p.image ?? p.imageUrl;
  return {
    id: p.id ?? undefined,
    codigo: p.code ?? '',
    nome: p.name ?? '',
    categoria: p.category ?? '',
    referencia: p.specification,
    compat: p.compat,
    maquinas: p.compatibleMachineIds?.length ? JSON.stringify(p.compatibleMachineIds) : '',
    localizacao: p.location ?? '',
    estoque: p.stock ?? 0,
    estoque_minimo: p.min ?? 0,
    unidade: p.unit ?? '',
    selagem: p.sealingType,
    diametro_min: p.diameterMin,
    diametro_max: p.diameterMax,
    imagem: image,
    created_by: p.createdBy,
    created_at: p.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Formatos
// ---------------------------------------------------------------------------

export interface FormatoRow {
  id?: string;
  nome?: unknown;
  produto_id?: unknown;
  maquina_id?: unknown;
  tipo?: unknown;
  volume?: unknown;
  volume_min?: unknown;
  volume_max?: unknown;
  diametro?: unknown;
  tipo_selagem?: unknown;
  categoria?: unknown;
  uo?: unknown;
  peca_ids?: unknown;
  pecas_alternativas?: unknown;
  descricao?: unknown;
  created_by?: unknown;
  created_at?: unknown;
  updated_by?: unknown;
  updated_at?: unknown;
}

export function rowToFormato(row: FormatoRow): Formato {
  const tipo = toStringOrUndef(row.tipo);
  return {
    id: toStringOrEmpty(row.id),
    name: toStringOrUndef(row.nome),
    formatType: tipo,
    tipo,
    volume: toNumber(row.volume),
    volMin: toNumber(row.volume_min),
    volMax: toNumber(row.volume_max),
    uo: toStringOrUndef(row.uo),
    category: toStringOrUndef(row.categoria),
    diameter: toNumber(row.diametro),
    productId: toStringOrUndef(row.produto_id),
    machineId: toStringOrUndef(row.maquina_id),
    partIds: parseJsonArray(row.peca_ids),
    alternativePartIds: parseJsonArray(row.pecas_alternativas),
    notes: toStringOrUndef(row.descricao),
    createdBy: toStringOrUndef(row.created_by),
    createdAt: toStringOrUndef(row.created_at),
    updatedBy: toStringOrUndef(row.updated_by),
    updatedAt: toStringOrUndef(row.updated_at),
  } as Formato;
}

export function formatoToRow(f: Partial<Formato>): FormatoRow {
  return {
    id: f.id ?? undefined,
    nome: f.name ?? '',
    produto_id: f.productId,
    maquina_id: f.machineId,
    tipo: f.formatType ?? f.tipo,
    volume: f.volume,
    volume_min: f.volMin,
    volume_max: (f as { volMax?: number }).volMax,
    diametro: f.diameter,
    categoria: f.category,
    uo: f.uo,
    peca_ids: f.partIds?.length ? JSON.stringify(f.partIds) : '',
    pecas_alternativas: f.alternativePartIds?.length ? JSON.stringify(f.alternativePartIds) : '',
    descricao: f.notes,
    created_by: f.createdBy,
    created_at: f.createdAt,
    updated_by: f.updatedBy,
    updated_at: f.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Fluxos
// ---------------------------------------------------------------------------

export interface FlowRow {
  id?: string;
  nome?: unknown;
  maquina?: unknown;
  machine_id?: unknown;
  linha?: unknown;
  produto?: unknown;
  product_id?: unknown;
  codigo?: unknown;
  vol?: unknown;
  data?: unknown;
  format_id?: unknown;
  formato_nome?: unknown;
  version?: unknown;
  status?: unknown;
  pecas_primarias?: unknown;
  pecas_alternativas?: unknown;
  ferramentais?: unknown;
  created_by?: unknown;
  created_at?: unknown;
  updated_by?: unknown;
  updated_at?: unknown;
}

export function rowToFlow(row: FlowRow): Flow {
  const tooling = parseJson<Array<Record<string, unknown>>>(row.ferramentais, []);
  return {
    id: toStringOrEmpty(row.id),
    name: toStringOrEmpty(row.nome),
    machine: toStringOrEmpty(row.maquina),
    machineId: toStringOrUndef(row.machine_id),
    line: toStringOrUndef(row.linha),
    product: toStringOrEmpty(row.produto),
    productId: toStringOrUndef(row.product_id),
    code: toStringOrEmpty(row.codigo),
    vol: toStringOrUndef(row.vol),
    date: toStringOrEmpty(row.data),
    ver: toStringOrEmpty(row.version),
    status: toStringOrEmpty(row.status),
    formatId: toStringOrUndef(row.format_id),
    formatName: toStringOrUndef(row.formato_nome),
    parts: {
      primary: parseJson<FlowPart[]>(row.pecas_primarias, []),
      alternative: parseJson<FlowPart[]>(row.pecas_alternativas, []),
    },
    tooling,
    toolingCount: tooling.length > 0 ? tooling.length : undefined,
    toolingTotal: tooling.length > 0 ? tooling.length : undefined,
    createdBy: toStringOrUndef(row.created_by),
    createdAt: toStringOrUndef(row.created_at),
    updatedBy: toStringOrUndef(row.updated_by),
    updatedAt: toStringOrUndef(row.updated_at),
  };
}

export function flowToRow(f: Partial<Flow>): FlowRow {
  return {
    id: f.id ?? undefined,
    nome: f.name ?? '',
    maquina: f.machine ?? '',
    machine_id: f.machineId,
    linha: f.line,
    produto: f.product ?? '',
    product_id: f.productId,
    codigo: f.code ?? '',
    vol: f.vol,
    data: f.date,
    format_id: f.formatId,
    formato_nome: f.formatName,
    version: f.ver ?? '',
    status: f.status ?? '',
    pecas_primarias: f.parts?.primary?.length ? JSON.stringify(f.parts.primary) : '',
    pecas_alternativas: f.parts?.alternative?.length ? JSON.stringify(f.parts.alternative) : '',
    ferramentais: f.tooling?.length ? JSON.stringify(f.tooling) : '',
    created_by: f.createdBy,
    created_at: f.createdAt,
    updated_by: f.updatedBy,
    updated_at: f.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Genéricos para export/import
// ---------------------------------------------------------------------------

export type DbEntityName = 'maquinas' | 'produtos' | 'pecas' | 'formatos' | 'fluxos' | 'configuracoes';

export function rowToDomain(entity: DbEntityName, row: Record<string, unknown>): unknown {
  switch (entity) {
    case 'maquinas': return rowToMachine(row as MachineRow);
    case 'produtos': return rowToProduct(row as ProductRow);
    case 'pecas': return rowToPiece(row as PieceRow);
    case 'formatos': return rowToFormato(row as FormatoRow);
    case 'fluxos': return rowToFlow(row as FlowRow);
    default: return row;
  }
}

export function domainToRow(entity: DbEntityName, obj: unknown): Record<string, unknown> {
  switch (entity) {
    case 'maquinas': return machineToRow(obj as Partial<Machine>) as Record<string, unknown>;
    case 'produtos': return productToRow(obj as Partial<Product>) as Record<string, unknown>;
    case 'pecas': return pieceToRow(obj as Partial<Piece>) as Record<string, unknown>;
    case 'formatos': return formatoToRow(obj as Partial<Formato>) as Record<string, unknown>;
    case 'fluxos': return flowToRow(obj as Partial<Flow>) as Record<string, unknown>;
    default: return obj as Record<string, unknown>;
  }
}
