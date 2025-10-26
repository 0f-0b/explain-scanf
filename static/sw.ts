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

async function createCache(): Promise<undefined> {
  const cache = await caches.open(currentCacheKey);
  await cache.addAll(CACHEABLE_PATHS);
}

async function evictOldCaches(): Promise<undefined> {
  const keys = await caches.keys();
  await Promise.all(
    keys.map((key) => key === currentCacheKey ? false : caches.delete(key)),
  );
}

async function queryCache(req: Request): Promise<Response> {
  return await caches.match(req, {
    cacheName: currentCacheKey,
  }) ?? await fetch(req);
}

addEventListener("install", (event) => event.waitUntil(createCache()));
addEventListener("activate", (event) => event.waitUntil(evictOldCaches()));
addEventListener(
  "fetch",
  (event) => event.respondWith(queryCache(event.request)),
);
