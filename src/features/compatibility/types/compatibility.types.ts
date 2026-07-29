import type { Formato } from '../../formatos/types/formato.types';
import type { Piece } from '../../pieces/types/piece.types';

// ----- Existing types (kept for backward compat) -----

export interface FormatCompatResult {
  formato: Formato;
  level: 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  points: number;
}

export interface CompatLevel {
  level: FormatCompatResult['level'];
  points: number;
}

export interface UOConfigData {
  ferramentais?: string[];
  tiposFormato?: string[];
  categorias?: string[];
  linhas?: string[];
  toolingCategories?: string[];
  formatTypes?: string[];
  productCategories?: string[];
  lines?: string[];
}

// ----- New rule-based compatibility types -----

export type CompatibilityGroup = 'SELAGEM' | 'DIMENSIONAL';

export interface ProductCharacteristics {
  sealingType: string;
  tubeDiameter: number;
}

export interface SetupPart {
  piece: Piece;
  group: CompatibilityGroup;
  determination: string;
  confidence: 'exact' | 'range' | 'fallback';
}

export interface SetupResolution {
  parts: SetupPart[];
  groups: Record<CompatibilityGroup, SetupPart[]>;
  warnings: string[];
}

export interface CategoryRule {
  category: string;
  group: CompatibilityGroup;
  strategy: 'sealing' | 'diameter' | 'combined';
  label: string;
}
