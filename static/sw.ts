/// <reference no-default-lib="true" />
/// <reference lib="es2020" />
/// <reference lib="webworker" />
/// <reference lib="webworker.iterable" />

declare global {
  function addEventListener<K extends keyof ServiceWorkerGlobalScopeEventMap>(
    type: K,
    listener: (
      this: ServiceWorkerGlobalScope,
      event: ServiceWorkerGlobalScopeEventMap[K],
    ) => unknown,
    options?: AddEventListenerOptions | boolean,
  ): undefined;
}

// Defined in build script
declare const CURRENT_CACHE_KEY: string;
declare const CACHEABLE_PATHS: readonly string[];
const currentCacheKey = CURRENT_CACHE_KEY;
const cacheablePaths = new Set(CACHEABLE_PATHS);

async function cachedFetch(req: Request): Promise<Response> {
  console.log(`Intercepting request to ${req.url}`);
  const res = await fetch(req).catch(Response.error);
  if (res.ok) {
    const cache = await caches.open(currentCacheKey);
    cache.put(req, res.clone());
  } else {
    const cached = await caches.match(req);
    if (cached) {
      return cached;
    }
  }
  return res;
}

addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(async (key) => {
      if (key !== currentCacheKey) {
        await caches.delete(key);
      }
    }));
  })());
});
addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (cacheablePaths.has(url.pathname)) {
    event.respondWith(cachedFetch(req));
  }
});
