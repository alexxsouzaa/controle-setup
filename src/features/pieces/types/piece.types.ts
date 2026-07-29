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
}
