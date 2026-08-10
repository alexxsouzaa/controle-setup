export type LineStatus = 'active' | 'inactive';

export interface Line {
  id: string;
  code?: string;
  name: string;
  unitId: string;
  machineIds?: string[];
  status: LineStatus;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}
