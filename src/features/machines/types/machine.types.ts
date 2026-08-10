import type { ResourceScope } from '../../units/types/unit.types';

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
