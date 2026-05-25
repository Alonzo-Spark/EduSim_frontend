import { create } from 'zustand'

export interface Asset {
  id: string
  name: string
  category: string
}

interface AssetStore {
  assets: Asset[]
  setAssets: (assets: Asset[]) => void
}

export const useAssetStore = create<AssetStore>((set) => ({
  assets: [],
  setAssets: (assets) => set({ assets })
}))
