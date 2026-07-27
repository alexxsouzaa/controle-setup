import type { Formato } from '../../types';

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
