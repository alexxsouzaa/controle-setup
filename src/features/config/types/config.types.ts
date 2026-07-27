export interface UoConfig {
  ferramentais?: string[];
  tiposFormato?: string[];
  categorias?: string[];
  linhas?: string[];
  toolingCategories?: string[];
  formatTypes?: string[];
  productCategories?: string[];
  lines?: string[];
}

export interface Config {
  uoConfigs?: Record<string, UoConfig>;
  [key: string]: unknown;
}

export interface Stats {
  totalFlows: number;
  totalMachines: number;
  totalProducts: number;
  totalPieces: number;
  totalFormatos: number;
  activeMachines: number;
  flowsToday: number;
  lowStockPieces: number;
}
