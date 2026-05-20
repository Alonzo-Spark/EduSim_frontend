type ProgressCallback = (info: { loaded: number; total: number; failed: number; current?: string }) => void;

type CacheEntry = { img?: HTMLImageElement; status: 'loaded' | 'loading' | 'failed'; attempts: number };

const imageCache: Map<string, CacheEntry> = new Map();
const inFlightLoads: Map<string, Promise<HTMLImageElement>> = new Map();

function normalizeUrl(url: string) {
  if (!url) return url;
  return String(url).trim();
}

export function getCachedImage(url?: string): HTMLImageElement | null {
  if (!url) return null;
  const key = normalizeUrl(url);
  const entry = imageCache.get(key);
  return entry?.img ?? null;
}

export function preloadImage(url?: string, options?: { retries?: number; timeoutMs?: number }): Promise<HTMLImageElement> {
  if (!url) return Promise.reject(new Error('Empty URL'));

  const key = normalizeUrl(url);
  const retries = options?.retries ?? 2;
  const timeoutMs = options?.timeoutMs ?? 10000;

  const existing = imageCache.get(key);
  if (existing?.status === 'loaded' && existing.img) {
    return Promise.resolve(existing.img);
  }

  const pending = inFlightLoads.get(key);
  if (pending) {
    return pending;
  }

  let attempts = existing?.attempts ?? 0;

  const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
    const attempt = () => {
      attempts += 1;
      imageCache.set(key, { status: 'loading', attempts });

      const img = new Image();
      let settled = false;
      let timer: number | undefined;

      const finalize = (status: CacheEntry['status'], value?: HTMLImageElement, error?: unknown) => {
        if (settled) return;
        settled = true;
        if (timer !== undefined) {
          clearTimeout(timer);
        }
        if (status === 'loaded' && value) {
          imageCache.set(key, { status, attempts, img: value });
          inFlightLoads.delete(key);
          resolve(value);
          return;
        }
        if (status === 'failed') {
          imageCache.set(key, { status, attempts });
          inFlightLoads.delete(key);
          reject(error instanceof Error ? error : new Error(`Failed to load image: ${key}`));
        }
      };

      timer = window.setTimeout(() => {
        if (attempts <= retries) {
          attempt();
          return;
        }
        finalize('failed', undefined, new Error(`Image load timeout: ${key}`));
      }, timeoutMs);

      img.decoding = 'async';
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        if (img.naturalWidth > 0) {
          finalize('loaded', img);
          return;
        }
        if (attempts <= retries) {
          attempt();
          return;
        }
        finalize('failed', undefined, new Error(`Image loaded without dimensions: ${key}`));
      };

      img.onerror = () => {
        if (attempts <= retries) {
          attempt();
          return;
        }
        finalize('failed', undefined, new Error(`Failed to load image: ${key}`));
      };

      try {
        img.src = key;
      } catch (err) {
        if (attempts <= retries) {
          attempt();
          return;
        }
        finalize('failed', undefined, err);
      }
    };

    attempt();
  });

  inFlightLoads.set(key, loadPromise);
  return loadPromise;
}

export async function preloadAssets(urls: string[], onProgress?: ProgressCallback, opts?: { retries?: number; timeoutMs?: number }) {
  const unique = Array.from(new Set((urls || []).map(normalizeUrl).filter(Boolean)));
  const total = unique.length;
  let loaded = 0;
  let failed = 0;

  const results: Array<{ url: string; status: 'loaded' | 'failed' }> = [];

  const promises = unique.map((url) => {
    return preloadImage(url, { retries: opts?.retries, timeoutMs: opts?.timeoutMs })
      .then((img) => {
        loaded += 1;
        results.push({ url, status: 'loaded' });
        onProgress?.({ loaded, total, failed, current: url });
        return { url, status: 'loaded', img };
      })
      .catch((err) => {
        failed += 1;
        results.push({ url, status: 'failed' });
        onProgress?.({ loaded, total, failed, current: url });
        return { url, status: 'failed', err };
      });
  });

  const settled = await Promise.all(promises);
  return {
    total,
    loaded,
    failed,
    results: settled,
  };
}

export { imageCache };
