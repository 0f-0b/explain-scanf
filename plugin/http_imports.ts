import { AsyncMutex } from "../deps/@esfx/async_mutex.ts";
import { DenoDir, FetchCacher, FileFetcher } from "../deps/deno_cache.ts";
import { MediaType, parseModule } from "../deps/deno_graph.ts";
import type { Loader, Plugin } from "../deps/esbuild.ts";

export const httpImports: Plugin = (() => {
  const name = "http-imports";
  const loaders = new Map<MediaType, Loader>([
    [MediaType.JavaScript, "js"],
    [MediaType.Mjs, "js"],
    [MediaType.Cjs, "js"],
    [MediaType.Jsx, "jsx"],
    [MediaType.TypeScript, "ts"],
    [MediaType.Mts, "ts"],
    [MediaType.Cts, "ts"],
    [MediaType.Dts, "ts"],
    [MediaType.Dmts, "ts"],
    [MediaType.Dcts, "ts"],
    [MediaType.Tsx, "tsx"],
    [MediaType.Json, "json"],
  ]);
  const denoDir = new DenoDir();
  const { load: loadUnsafe } = new FetchCacher(
    denoDir.gen,
    denoDir.deps,
    new FileFetcher(denoDir.deps),
  );
  const mutexes = new Map<string, AsyncMutex>();
  const load = async (specifier: string) => {
    const key = denoDir.deps.getCacheFilename(new URL(specifier));
    const mutex = mutexes.get(key) ?? new AsyncMutex();
    if (!mutex.tryLock()) {
      await mutex.lock();
    }
    mutexes.set(key, mutex);
    try {
      return await loadUnsafe(specifier);
    } finally {
      mutexes.delete(key);
      mutex.unlock();
    }
  };
  return {
    name,
    setup(build) {
      build.onResolve(
        { filter: /^https?:/ },
        ({ path }) => ({ path, namespace: name }),
      );
      build.onResolve(
        { filter: /(?:)/, namespace: name },
        ({ path, importer }) => ({
          path: new URL(path, importer).href,
          namespace: name,
        }),
      );
      build.onLoad(
        { filter: /(?:)/, namespace: name },
        async ({ path }) => {
          const res = await load(path);
          if (res?.kind !== "module") {
            return null;
          }
          const mod = parseModule(res.specifier, res.content, {
            headers: res.headers,
          });
          return {
            contents: mod.source,
            loader: loaders.get(mod.mediaType),
          };
        },
      );
    },
  };
})();
