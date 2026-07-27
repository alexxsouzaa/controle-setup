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
