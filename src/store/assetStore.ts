import { create } from 'zustand';

export type CompiledAsset = {
  id: string;
  name: string;
  category?: string;
};

interface AssetStore {
  assets: CompiledAsset[];
  setAssets: (a: CompiledAsset[]) => void;
  addAsset: (a: CompiledAsset) => void;
}

export const useAssetStore = create<AssetStore>((set) => ({
  assets: [],
  setAssets: (a) => set({ assets: a }),
  addAsset: (a) => set((s) => ({ assets: [...s.assets, a] })),
}));
