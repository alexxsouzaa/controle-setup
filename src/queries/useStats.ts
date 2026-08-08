import { useQueries } from '@tanstack/react-query';
import { machinesApi, productsApi, piecesApi, flowsApi, formatosApi } from '../lib/api';
import type { Stats } from '../types';

export function useStats(): Stats {
  const results = useQueries({
    queries: [
      { queryKey: ['machines'], queryFn: () => machinesApi.list(), staleTime: Infinity },
      { queryKey: ['products'], queryFn: () => productsApi.list(), staleTime: Infinity },
      { queryKey: ['pieces'], queryFn: () => piecesApi.list(), staleTime: Infinity },
      { queryKey: ['flows'], queryFn: () => flowsApi.list(), staleTime: Infinity },
      { queryKey: ['formatos'], queryFn: () => formatosApi.list(), staleTime: Infinity },
    ],
  });

  const data = {
    machines: results[0].data ?? [],
    products: results[1].data ?? [],
    pieces: results[2].data ?? [],
    flows: results[3].data ?? [],
    formatos: results[4].data ?? [],
  };

  return {
    totalFlows: data.flows.length,
    totalMachines: data.machines.length,
    totalProducts: data.products.length,
    totalPieces: data.pieces.length,
    totalFormatos: data.formatos.length,
    activeMachines: new Set(data.flows.map(f => f.machineId || f.machine).filter(Boolean)).size,
    flowsToday: data.flows.filter(f => f.date === new Date().toISOString().slice(0, 10)).length,
    lowStockPieces: data.pieces.filter(p => p.stock <= p.min).length,
  };
}
