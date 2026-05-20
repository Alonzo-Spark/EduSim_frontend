export const preloadAssets = async (assets) => {
  if (!Array.isArray(assets) || assets.length === 0) return true;

  console.log("[Preloader] Starting asset preload...", assets);
  
  const promises = assets.map((src) => {
    if (!src) return Promise.resolve(true);
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(true);
      img.onerror = () => {
        console.warn(`[Preloader] Failed to resolve sprite: ${src}. Continuing gracefully.`);
        resolve(true); // Don't block simulation if one asset fails
      };
    });
  });

  await Promise.all(promises);
  console.log("[Preloader] All assets resolved.");
  return true;
};
