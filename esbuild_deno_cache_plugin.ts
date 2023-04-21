import { DenoDir, FileFetcher } from "./deps/deno_cache.ts";
import { init, MediaType, parseModule } from "./deps/deno_graph.ts";
import type { Loader, Plugin } from "./deps/esbuild.ts";
import { AsyncMutex } from "./deps/esfx/async_mutex.ts";
import {
  type ImportMap,
  resolveImportMap,
  resolveModuleSpecifier,
} from "./deps/importmap.ts";
import { fromFileUrl, toFileUrl } from "./deps/std/path.ts";

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
const { deps } = new DenoDir();
const fetcher = new FileFetcher(deps);
const mutexes = new Map<string, AsyncMutex>();
const load = async (specifier: string) => {
  const url = new URL(specifier);
  const key = deps.getCacheFilename(url);
  const mutex = mutexes.get(key) ?? new AsyncMutex();
  if (!mutex.tryLock()) {
    await mutex.lock();
  }
  mutexes.set(key, mutex);
  try {
    return await fetcher.fetch(url);
  } finally {
    mutexes.delete(key);
    mutex.unlock();
  }
};

export function denoCachePlugin(importMapURL?: string | URL): Plugin {
  if (importMapURL !== undefined) {
    importMapURL = new URL(importMapURL).href;
  }
  return {
    name: "deno-cache",
    setup(build) {
      let importMap: ImportMap | undefined;
      build.onStart(async () => {
        if (importMapURL !== undefined) {
          const res = await fetch(importMapURL);
          importMap = resolveImportMap(await res.json(), new URL(importMapURL));
        }
      });
      build.onResolve(
        { filter: /(?:)/ },
        ({ path, importer, namespace }) => {
          if (!importer) {
            return null;
          }
          const referrer = namespace === "remote"
            ? new URL(importer)
            : toFileUrl(importer);
          const resolved = importMap
            ? new URL(resolveModuleSpecifier(path, importMap, referrer))
            : new URL(path, referrer);
          return /^https?:$/.test(resolved.protocol)
            ? { path: resolved.href, namespace: "remote" }
            : { path: fromFileUrl(resolved), namespace };
        },
      );
      build.onLoad(
        { filter: /(?:)/, namespace: "remote" },
        async ({ path }) => {
          const res = await load(path);
          if (res?.kind !== "module") {
            return null;
          }
          await init();
          const mod = parseModule(res.specifier, res.content, {
            headers: res.headers,
          });
          return {
            contents: res.content,
            loader: loaders.get(mod.mediaType ?? MediaType.Unknown),
          };
        },
      );
    },
  };
}
