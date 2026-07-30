import type { FlowPart } from '../../flows/types/flow.types';

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
  pieces?: FlowPart[];
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}
