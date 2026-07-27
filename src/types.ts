export interface Machine {
  id: string;
  name: string;
  line?: string;
  lines?: string[];
  uo: string;
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
  productId?: string;
  machineId?: string;
  partIds?: string[];
  alternativePartIds?: string[];
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

export interface AppActions {
  addMachine: (m: Partial<Machine> & { name: string; uo: string }) => void;
  updateMachine: (id: string, updates: Partial<Machine>) => void;
  deleteMachine: (id: string) => void;
  deleteMachines: (ids: string[]) => void;
  addProduct: (p: Partial<Product> & { name: string; code: string; category: string }) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  deleteProducts: (ids: string[]) => void;
  addPiece: (p: Partial<Piece> & { name: string; category: string }) => void;
  updatePiece: (id: string, updates: Partial<Piece>) => void;
  deletePiece: (id: string) => void;
  deletePieces: (ids: string[]) => void;
  addFlow: (f: Partial<Flow> & { name: string }) => void;
  updateFlow: (id: string, updates: Partial<Flow>) => void;
  duplicateFlow: (id: string) => void;
  deleteFlow: (id: string) => void;
  deleteFlows: (ids: string[]) => void;
  addFormato: (f: Partial<Formato>) => void;
  updateFormato: (id: string, updates: Partial<Formato>) => void;
  deleteFormato: (id: string) => void;
  deleteFormatos: (ids: string[]) => void;
  logAction: (type: string, entity: string, detail: string) => void;
  clearHistory: () => void;
  exportAll: () => string;
  importData: (imported: unknown) => number;
  updateConfig: (updates: Partial<Config>) => void;
}

export interface AppData extends AppActions {
  machines: Machine[];
  products: Product[];
  pieces: Piece[];
  flows: Flow[];
  formatos: Formato[];
  history: HistoryEntry[];
  config: Config;
  stats: Stats;
  getCurrentUser: () => string;
  setCurrentUser: (name: string) => void;
}
