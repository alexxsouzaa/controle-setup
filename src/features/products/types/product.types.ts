import type { ResourceScope } from '../../units/types/unit.types';

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
  unitId?: string;
  scope?: ResourceScope;
  notes?: string;
  created?: string;
  createdAt?: string;
}
