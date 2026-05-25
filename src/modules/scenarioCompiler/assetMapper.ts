import { useAssetStore } from '@/store/assetStore'

export async function loadAssets(assets: any[]) {
  const setAssets = useAssetStore.getState().setAssets
  setAssets(assets)
}
