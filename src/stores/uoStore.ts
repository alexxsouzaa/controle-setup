import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Unit } from '../types';

interface UoStore {
  activeUnitId: string | null;
  setActiveUnitId: (id: string | null) => void;
  activeUnit: Unit | null;
  setActiveUnit: (unit: Unit | null) => void;
}

export const useUoStore = create<UoStore>()(
  persist(
    (set) => ({
      activeUnitId: null,
      setActiveUnitId: (id) => set({ activeUnitId: id }),
      activeUnit: null,
      setActiveUnit: (unit) => set({ activeUnit: unit, activeUnitId: unit?.id ?? null }),
    }),
    {
      name: 'cs-uo-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeUnitId: state.activeUnitId }),
    }
  )
);
