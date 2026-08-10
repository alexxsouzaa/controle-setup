export type ResourceScope = 'global' | 'unit';

export interface Unit {
  id: string;
  code: string;
  name: string;
  status: 'active' | 'inactive';
  description?: string;
  createdAt: string;
  createdBy?: string;
}

export interface Line {
  id: string;
  code?: string;
  name: string;
  unitId: string;
  machineIds?: string[];
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

export interface Machine {
  id: string;
  name: string;
  line?: string;
  lines?: string[];
  uo: string;
  unitId?: string;
  scope?: ResourceScope;
  type?: string;
  outils?: number;
  toolingCategories?: string[];
  ferramentais?: string[];
  photo?: string;
  image?: string;
  notes?: string;
  updatedAt?: string;
  createdAt: string;
  createdBy?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  family?: string;
  vol?: number;
  volume?: number;
  unit?: string;
  volumeUnit?: string;
  packaging?: string;
  weight?: string;
  photo?: string;
  image?: string;
  formatType?: string;
  formato?: string;
  unitId?: string;
  scope?: ResourceScope;
  notes?: string;
  created?: string;
  createdAt?: string;
}

export interface Piece {
  id: string;
  code: string;
  name: string;
  category: string;
  specification?: string;
  compat: string;
  compatibleMachineIds?: string[];
  location: string;
  stock: number;
  min: number;
  unit: string;
  image?: string;
  imageUrl?: string;
  createdBy?: string;
  createdAt?: string;
  sealingType?: string;
  diameterMin?: number;
  diameterMax?: number;
  unitId?: string;
  scope?: ResourceScope;
}

export interface FlowPart {
  pieceId: string;
  pieceName: string;
  pieceCode: string;
  pieceCategory: string;
}

export interface Flow {
  id: string;
  name: string;
  machine: string;
  machineId?: string;
  line?: string;
  product: string;
  productId?: string;
  code: string;
  vol?: string;
  date: string;
  ver: string;
  status: string;
  unitId?: string;
  formatId?: string;
  formatName?: string;
  parts?: {
    primary: FlowPart[];
    alternative: FlowPart[];
  };
  tooling?: Array<Record<string, unknown>>;
  toolingCount?: number;
  toolingTotal?: number;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface Formato {
  id: string;
  name?: string;
  formatType?: string;
  tipo?: string;
  volume?: number;
  volMin?: number;
  volumeUnit?: string;
  uo?: string;
  category?: string;
  diameter?: number;
  productId?: string;
  machineId?: string;
  partIds?: string[];
  alternativePartIds?: string[];
  unitId?: string;
  scope?: ResourceScope;
  pieces?: FlowPart[];
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface HistoryEntry {
  id: string;
  type: string;
  entity: string;
  detail: string;
  date: string;
}

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
