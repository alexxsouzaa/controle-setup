export type UnitStatus = 'active' | 'inactive';

export interface Unit {
  id: string;
  code: string;
  name: string;
  status: UnitStatus;
  description?: string;
  createdAt: string;
  createdBy?: string;
}

export type ResourceScope = 'global' | 'unit';
