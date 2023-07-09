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

function asPath(pathOrURL: string | URL): string {
  return typeof pathOrURL === "string" ? pathOrURL : fromFileUrl(pathOrURL);
}

interface NpmSpecifier {
  name: string;
  version: string;
  path: string;
}

const npmSpecifierRE = /^\/?((?:@[^/]+\/)?[^@/]+)(?:@([^/]+))?((?:\/[^]*)?)$/;

function parseNpmSpecifier(str: string): NpmSpecifier {
  const match = npmSpecifierRE.exec(str);
  if (!match) {
    throw new TypeError("Invalid package specifier");
  }
  const { 1: name, 2: version = "*", 3: path } = match;
  return { name, version, path };
}

export interface DenoCachePluginOptions {
  importMapURL?: string | URL;
  nodeResolutionRootDir?: string | URL;
}

export function denoCachePlugin(options?: DenoCachePluginOptions): Plugin {
  const importMapURL = (() => {
    const url = options?.importMapURL;
    return url === undefined ? undefined : new URL(url).href;
  })();
  const nodeResolutionRootDir = (() => {
    const pathOrURL = options?.nodeResolutionRootDir;
    return pathOrURL === undefined ? undefined : asPath(pathOrURL);
  })();
  return {
    name: "deno-cache",
    setup(build) {
      let importMap: ImportMap = {};
      build.onStart(async () => {
        if (importMapURL !== undefined) {
          const res = await fetch(importMapURL);
          importMap = resolveImportMap(await res.json(), new URL(importMapURL));
        }
      });
      build.onResolve(
        { filter: /(?:)/ },
        ({ path, importer, namespace, resolveDir, kind }) => {
          if (kind !== "import-statement" && kind !== "dynamic-import") {
            return null;
          }
          let resolved: URL;
          try {
            const referrer = namespace === "remote"
              ? new URL(importer)
              : toFileUrl(importer);
            resolved = new URL(
              resolveModuleSpecifier(path, importMap, referrer),
            );
          } catch {
            return null;
          }
          switch (resolved.protocol) {
            case "http:":
            case "https:":
              return { path: resolved.href, namespace: "remote" };
            case "npm:": {
              const { name, path } = parseNpmSpecifier(resolved.pathname);
              return build.resolve(`${name}${path}`, {
                importer,
                resolveDir: nodeResolutionRootDir ?? resolveDir,
                kind: "import-statement",
              });
            }
            default:
              return { path: fromFileUrl(resolved), namespace };
          }
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
