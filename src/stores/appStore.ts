import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Stats } from '../types';

interface AppStore {
  currentUser: string;
  setCurrentUser: (name: string) => void;
  stats: Stats;
  recalcStats: (data?: { flows?: any[]; machines?: any[]; products?: any[]; pieces?: any[]; formatos?: any[] }) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      currentUser: (() => { try { return localStorage.getItem('cs-user') || 'Operador'; } catch { return 'Operador'; } })(),
      setCurrentUser: (name: string) => {
        try { localStorage.setItem('cs-user', name); } catch { }
        set({ currentUser: name });
      },
      stats: { totalFlows: 0, totalMachines: 0, totalProducts: 0, totalPieces: 0, totalFormatos: 0, activeMachines: 0, flowsToday: 0, lowStockPieces: 0 },
      recalcStats: (data) => set({
        stats: data ? {
          totalFlows: data.flows?.length || 0,
          totalMachines: data.machines?.length || 0,
          totalProducts: data.products?.length || 0,
          totalPieces: data.pieces?.length || 0,
          totalFormatos: data.formatos?.length || 0,
          activeMachines: new Set(data.flows?.map((f: any) => f.machineId || f.machine).filter(Boolean)).size,
          flowsToday: data.flows?.filter((f: any) => f.date === new Date().toISOString().slice(0, 10)).length || 0,
          lowStockPieces: data.pieces?.filter((p: any) => p.stock <= p.min).length || 0,
        } : { totalFlows: 0, totalMachines: 0, totalProducts: 0, totalPieces: 0, totalFormatos: 0, activeMachines: 0, flowsToday: 0, lowStockPieces: 0 },
      }),
    }),
    {
      name: 'cs-app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
