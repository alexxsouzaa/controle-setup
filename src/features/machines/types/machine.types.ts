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
