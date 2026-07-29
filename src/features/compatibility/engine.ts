import type { Config } from '../config/types/config.types';
import type { Machine } from '../machines/types/machine.types';
import type { Product } from '../products/types/product.types';
import type { Formato } from '../formatos/types/formato.types';
import type { Piece } from '../pieces/types/piece.types';
import type { FlowPart, Flow } from '../flows/types/flow.types';
import type {
  FormatCompatResult,
  CompatLevel,
  UOConfigData,
  CompatibilityGroup,
  ProductCharacteristics,
  SetupPart,
  SetupResolution,
  CategoryRule,
} from './types';

// =============================================================================
// Category → Group mapping & rule definitions
// =============================================================================

export const CATEGORY_RULES: CategoryRule[] = [
  { category: 'Faca',                        group: 'SELAGEM',    strategy: 'sealing',  label: 'Faca' },
  { category: 'Mordente',                    group: 'SELAGEM',    strategy: 'sealing',  label: 'Mordente' },
  { category: 'Régua do Mordente',           group: 'SELAGEM',    strategy: 'sealing',  label: 'Régua do Mordente' },
  { category: 'Batedor do Mordente',         group: 'SELAGEM',    strategy: 'sealing',  label: 'Batedor do Mordente' },
  { category: 'Copos',                       group: 'DIMENSIONAL', strategy: 'diameter', label: 'Copo' },
  { category: 'Ponteira do Empurrador',      group: 'DIMENSIONAL', strategy: 'diameter', label: 'Ponteira do Empurrador' },
  { category: 'Ponteira do Centralizador',   group: 'DIMENSIONAL', strategy: 'diameter', label: 'Ponteira do Centralizador' },
  { category: 'Bico de Envase',              group: 'DIMENSIONAL', strategy: 'diameter', label: 'Bico de Envase' },
  { category: 'Ponteira',                    group: 'DIMENSIONAL', strategy: 'diameter', label: 'Ponteira' },
  { category: 'Berço',                       group: 'DIMENSIONAL', strategy: 'diameter', label: 'Berço' },
  { category: 'Bico de Ar Quente',           group: 'DIMENSIONAL', strategy: 'combined', label: 'Conjunto do Bico de Ar Quente' },
  { category: 'Camisa do Bico de Ar Quente', group: 'DIMENSIONAL', strategy: 'combined', label: 'Camisa do Bico de Ar Quente' },
  { category: 'Ponteira do Bico de Ar Quente', group: 'DIMENSIONAL', strategy: 'combined', label: 'Ponteira do Bico de Ar Quente' },
  { category: 'Suporte do Camisa do Bico de Ar Quente', group: 'DIMENSIONAL', strategy: 'combined', label: 'Suporte do Bico de Ar Quente' },
  { category: 'Estação de Limpeza',          group: 'DIMENSIONAL', strategy: 'diameter', label: 'Estação de Limpeza' },
];

const CATEGORY_GROUP_MAP: Record<string, CompatibilityGroup> = {};
const CATEGORY_STRATEGY_MAP: Record<string, CategoryRule['strategy']> = {};
for (const rule of CATEGORY_RULES) {
  CATEGORY_GROUP_MAP[rule.category] = rule.group;
  CATEGORY_STRATEGY_MAP[rule.category] = rule.strategy;
}

// =============================================================================
// Engine: resolveSetup — new rule-based compatibility engine
// =============================================================================

export function resolveSetup(
  characteristics: ProductCharacteristics,
  machine: Machine,
  allPieces: Piece[],
): SetupResolution {
  const machineCompatible = allPieces.filter(p => isMachineCompatible(p.compat, machine.name));
  const parts: SetupPart[] = [];
  const warnings: string[] = [];

  const rulesByStrategy = groupBy(CATEGORY_RULES, r => r.strategy);

  // 1. Resolve sealing-based categories
  for (const rule of (rulesByStrategy.sealing ?? [])) {
    const candidates = machineCompatible.filter(p => p.category === rule.category);
    const result = matchBySealing(candidates, characteristics.sealingType);
    if (result) {
      parts.push({ piece: result.piece, group: rule.group, determination: `Tipo de selagem: ${characteristics.sealingType}`, confidence: result.confidence });
    } else if (candidates.length > 0) {
      warnings.push(`Nenhuma ${rule.label} encontrada para selagem "${characteristics.sealingType}"`);
    }
  }

  // 2. Resolve diameter-based categories
  for (const rule of (rulesByStrategy.diameter ?? [])) {
    const candidates = machineCompatible.filter(p => p.category === rule.category);
    const result = matchByDiameter(candidates, characteristics.tubeDiameter);
    if (result) {
      parts.push({ piece: result.piece, group: rule.group, determination: `Diâmetro: ${characteristics.tubeDiameter}mm`, confidence: result.confidence });
    } else if (candidates.length > 0) {
      warnings.push(`Nenhum(a) ${rule.label} encontrado(a) para diâmetro ${characteristics.tubeDiameter}mm`);
    }
  }

  // 3. Resolve combined categories (sealing + diameter + machine)
  for (const rule of (rulesByStrategy.combined ?? [])) {
    const candidates = machineCompatible.filter(p => p.category === rule.category);
    const result = matchCombined(candidates, characteristics, machine);
    if (result) {
      parts.push({
        piece: result.piece,
        group: rule.group,
        determination: `Selagem "${characteristics.sealingType}" + Ø${characteristics.tubeDiameter}mm + ${machine.name}`,
        confidence: result.confidence,
      });
    } else if (candidates.length > 0) {
      warnings.push(`Nenhum(a) ${rule.label} compatível com a configuração atual`);
    }
  }

  const groups: Record<CompatibilityGroup, SetupPart[]> = {
    SELAGEM: parts.filter(p => p.group === 'SELAGEM'),
    DIMENSIONAL: parts.filter(p => p.group === 'DIMENSIONAL'),
  };

  return { parts, groups, warnings };
}

// =============================================================================
// Matching strategies
// =============================================================================

interface MatchResult {
  piece: Piece;
  confidence: SetupPart['confidence'];
}

function matchBySealing(candidates: Piece[], sealingType: string): MatchResult | null {
  if (candidates.length === 0) return null;

  const normalizedTarget = sealingType.toLowerCase().trim();

  // Exact match by sealingType field
  const exactField = candidates.find(p => p.sealingType?.toLowerCase() === normalizedTarget);
  if (exactField) return { piece: exactField, confidence: 'exact' };

  // Match by name/specification containing the sealing type
  const nameMatch = candidates.find(p =>
    p.name.toLowerCase().includes(normalizedTarget) ||
    p.specification?.toLowerCase().includes(normalizedTarget),
  );
  if (nameMatch) return { piece: nameMatch, confidence: 'fallback' };

  // Fallback: first in stock
  const inStock = candidates.find(p => p.stock > (p.min || 0));
  if (inStock) return { piece: inStock, confidence: 'fallback' };

  return { piece: candidates[0], confidence: 'fallback' };
}

function matchByDiameter(candidates: Piece[], tubeDiameter: number): MatchResult | null {
  if (candidates.length === 0) return null;

  // Exact range match using diameterMin/diameterMax
  const rangeMatch = candidates.find(p => {
    if (p.diameterMin == null && p.diameterMax == null) return false;
    const min = p.diameterMin ?? 0;
    const max = p.diameterMax ?? Infinity;
    return tubeDiameter >= min && tubeDiameter <= max;
  });
  if (rangeMatch) return { piece: rangeMatch, confidence: 'exact' };

  // Closest by mid-point of range
  const withRange = candidates.filter(p => p.diameterMin != null || p.diameterMax != null);
  if (withRange.length > 0) {
    const sorted = [...withRange].sort((a, b) => {
      const aMid = ((a.diameterMin ?? 0) + (a.diameterMax ?? Infinity)) / 2;
      const bMid = ((b.diameterMin ?? 0) + (b.diameterMax ?? Infinity)) / 2;
      return Math.abs(aMid - tubeDiameter) - Math.abs(bMid - tubeDiameter);
    });
    return { piece: sorted[0], confidence: 'range' };
  }

  // Fallback: name heuristics (e.g. "Copo 50mm", "Copo Padrão")
  const diameterStr = String(tubeDiameter);
  const nameMatch = candidates.find(p =>
    p.name.toLowerCase().includes(diameterStr) ||
    p.specification?.toLowerCase().includes(diameterStr),
  );
  if (nameMatch) return { piece: nameMatch, confidence: 'fallback' };

  // Last resort: first in stock
  const inStock = candidates.find(p => p.stock > (p.min || 0));
  if (inStock) return { piece: inStock, confidence: 'fallback' };

  return { piece: candidates[0], confidence: 'fallback' };
}

function matchCombined(candidates: Piece[], characteristics: ProductCharacteristics, machine: Machine): MatchResult | null {
  if (candidates.length === 0) return null;

  const normalizedSealing = characteristics.sealingType.toLowerCase().trim();

  // Match by all three criteria (sealingType + diameter range + machine)
  const exact = candidates.find(p => {
    const sealingOk = !p.sealingType || p.sealingType.toLowerCase() === normalizedSealing;
    const min = p.diameterMin ?? 0;
    const max = p.diameterMax ?? Infinity;
    const diamOk = !p.diameterMin && !p.diameterMax || (characteristics.tubeDiameter >= min && characteristics.tubeDiameter <= max);
    return sealingOk && diamOk;
  });
  if (exact) return { piece: exact, confidence: 'exact' };

  // Match by sealing + machine only (ignore diameter)
  const sealingMatch = candidates.find(p =>
    !p.sealingType || p.sealingType.toLowerCase() === normalizedSealing,
  );
  if (sealingMatch) return { piece: sealingMatch, confidence: 'range' };

  // Match by diameter + machine only (ignore sealing)
  const diamMatch = candidates.find(p => {
    const min = p.diameterMin ?? 0;
    const max = p.diameterMax ?? Infinity;
    return (!p.diameterMin && !p.diameterMax) || (characteristics.tubeDiameter >= min && characteristics.tubeDiameter <= max);
  });
  if (diamMatch) return { piece: diamMatch, confidence: 'range' };

  // Fallback: first in stock
  const inStock = candidates.find(p => p.stock > (p.min || 0));
  if (inStock) return { piece: inStock, confidence: 'fallback' };

  return { piece: candidates[0], confidence: 'fallback' };
}

// =============================================================================
// Legacy functions (kept for backward compatibility)
// =============================================================================

export const ALL_TOOLING_CATEGORIES: string[] = [
  'Copos', 'Ponteira do Empurrador', 'Ponteira do Centralizador',
  'Estação de Limpeza', 'Bico de Envase', 'Suporte do Camisa do Bico de Ar Quente',
  'Camisa do Bico de Ar Quente', 'Ponteira do Bico de Ar Quente',
  'Faca', 'Mordente', 'Régua do Mordente', 'Batedor do Mordente', 'Berço',
];

export function getToolingOptions(uo: string | undefined, config: Config): string[] {
  if (uo && config?.uoConfigs?.[uo]?.toolingCategories) return config.uoConfigs[uo].toolingCategories as string[];
  return [...ALL_TOOLING_CATEGORIES];
}

export function getFormatTypeOptions(uo: string | undefined, config: Config): string[] {
  if (uo && config?.uoConfigs?.[uo]?.formatTypes) return config.uoConfigs[uo].formatTypes as string[];
  return ['Frasco cilíndrico', 'Frasco oval', 'Pote', 'Bisnaga', 'Refil'];
}

export function getMachineTooling(machine: Machine | undefined, config: Config): string[] {
  if (!machine) return [];
  if (machine.toolingCategories && machine.toolingCategories.length > 0) return machine.toolingCategories;
  if (machine.id && machine.id.startsWith('tgm')) return ['Copos', 'Ponteira do Empurrador', 'Ponteira do Centralizador', 'Bico de Envase', 'Faca', 'Mordente', 'Régua do Mordente', 'Berço'];
  const uoFallback = getToolingOptions(machine.uo, config);
  return [...uoFallback];
}

function compatLevel(points: number): CompatLevel {
  if (points >= 4) return { level: 'success' as CompatLevel['level'], points };
  if (points >= 3) return { level: 'warning' as CompatLevel['level'], points };
  return { level: 'danger' as CompatLevel['level'], points };
}

function isMachineCompatible(pieceCompatField: string, machineName: string): boolean {
  if (!pieceCompatField || !machineName) return false;
  const names = pieceCompatField.split(',').map((s: string) => s.trim());
  return names.some((n: string) => machineName.includes(n) || n.includes(machineName) || machineName.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(machineName.toLowerCase()));
}

export function suggestFormatos(machine: Machine | undefined, product: Product | undefined, formatos: Formato[]): FormatCompatResult[] {
  if (!product) return [];
  const results: FormatCompatResult[] = [];
  for (const fmt of formatos) {
    let points = 0;
    if (fmt.productId === product.id || (fmt as unknown as Record<string, unknown>).productCode === product.code) points += 3;
    else if ((fmt as unknown as Record<string, unknown>).productName && product.name && String((fmt as unknown as Record<string, unknown>).productName).toLowerCase() === product.name.toLowerCase()) points += 2;
    const vol = Number(product.vol);
    if (!isNaN(vol) && vol > 0) {
      const minOk = fmt.volMin == null || fmt.volMin <= vol;
      const maxOk = (fmt as unknown as Record<string, unknown>).volMax == null || Number((fmt as unknown as Record<string, unknown>).volMax) >= vol;
      if (minOk && maxOk) points += 2;
      else if (minOk || maxOk) points += 1;
    }
    if (fmt.pieces && fmt.pieces.length > 0) points += 1;
    if (points > 0) {
      const cl = compatLevel(points);
      results.push({ formato: fmt, level: cl.level, points: cl.points });
    }
  }
  results.sort((a, b) => b.points - a.points);
  return results;
}

export function suggestPrimaryParts(fmt: Formato | undefined, pieces: Piece[]): EnrichedFlowPart[] {
  if (!fmt || !fmt.pieces || fmt.pieces.length === 0) return [];
  return fmt.pieces.map((p: FlowPart) => {
    const full = pieces.find((piece: Piece) => piece.id === p.pieceId || piece.code === p.pieceCode || piece.name === p.pieceName);
    return {
      ...p,
      stock: full?.stock,
      min: full?.min,
      location: full?.location,
      image: full?.image,
      isPrimary: true,
      available: full ? (full.stock > (full.min || 0)) : false,
    };
  });
}

export function suggestAlternativeParts(primaryParts: EnrichedFlowPart[], machine: Machine | undefined, pieces: Piece[]): EnrichedFlowPartWithAlternatives[] {
  if (!primaryParts || primaryParts.length === 0) return [];
  return primaryParts.map((primary: EnrichedFlowPart) => {
    const sameCategory = pieces.filter((p: Piece) =>
      p.id !== primary.pieceId &&
      p.category === primary.pieceCategory &&
      isMachineCompatible(p.compat, machine?.name ?? '')
    );
    if (sameCategory.length === 0) return { ...primary, alternatives: [] };
    const scored = sameCategory.map((p: Piece) => {
      let pts = 0;
      if (p.stock > (p.min || 0)) pts += 2;
      if (p.compat && machine && isMachineCompatible(p.compat, machine.name)) pts += 1;
      const level = pts >= 3 ? 'Ideal' : pts >= 2 ? 'Alta' : pts >= 1 ? 'Média' : 'Condicional';
      return { piece: p, level, available: p.stock > (p.min || 0), requiresAdjustment: level === 'Condicional' };
    }).sort((a: AlternativeOption, b: AlternativeOption) => {
      const order: Record<string, number> = { Ideal: 4, Alta: 3, Média: 2, Condicional: 1 };
      return (order[b.level] || 0) - (order[a.level] || 0);
    });
    return { ...primary, alternatives: scored };
  });
}

export function generateFlowName(product: Product | undefined, existingFlows: Flow[]): string {
  if (!product) return 'Novo Fluxo';
  const code = product.code || 'PROD';
  const name = product.name || '';
  const count = existingFlows.filter((f: Flow) => f.code === code).length;
  const version = count + 1;
  return `${code} - ${name.toUpperCase()} - V${version}`;
}

export function collectLines(machines: Machine[]): string[] {
  return [...new Set(machines.map((m: Machine) => m.line).filter(Boolean))] as string[];
}

// =============================================================================
// Internal helpers
// =============================================================================

interface EnrichedFlowPart extends FlowPart {
  stock?: number;
  min?: number;
  location?: string;
  image?: string;
  isPrimary?: boolean;
  available?: boolean;
}

interface AlternativeOption {
  piece: Piece;
  level: string;
  available: boolean;
  requiresAdjustment: boolean;
}

interface EnrichedFlowPartWithAlternatives extends EnrichedFlowPart {
  alternatives: AlternativeOption[];
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) result[key] = [];
    result[key].push(item);
  }
  return result;
}
