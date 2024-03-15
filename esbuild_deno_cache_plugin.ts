import { type CacheSetting, createCache } from "./deps/deno/cache_dir.ts";
import {
  createGraph,
  init,
  type LoadResponse,
  parseModule,
} from "./deps/deno/graph.ts";
import type { Loader, Plugin } from "./deps/esbuild.ts";
import { parseFromJson } from "./deps/import_map.ts";
import { fromFileUrl } from "./deps/std/path/from_file_url.ts";
import { resolve } from "./deps/std/path/resolve.ts";
import { toFileUrl } from "./deps/std/path/to_file_url.ts";

const decoder = new TextDecoder();
const loaders = new Map<string, Loader>([
  ["JavaScript", "js"],
  ["Mjs", "js"],
  ["Cjs", "js"],
  ["JSX", "jsx"],
  ["TypeScript", "ts"],
  ["Mts", "ts"],
  ["Cts", "ts"],
  ["Dts", "ts"],
  ["Dmts", "ts"],
  ["Dcts", "ts"],
  ["TSX", "tsx"],
  ["Json", "json"],
]);

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
  allowRemote?: boolean;
  cacheSetting?: CacheSetting;
  denoDir?: string | URL;
  vendorDir?: string | URL;
  importMapURL?: string | URL;
  nodeResolutionRootDir?: string | URL;
}

export function denoCachePlugin(options?: DenoCachePluginOptions): Plugin {
  const allowRemote = options?.allowRemote;
  const cacheSetting = options?.cacheSetting;
  const denoDir = options?.denoDir;
  const vendorDir = options?.vendorDir;
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
      let load: (specifier: string) => Promise<LoadResponse | undefined>;
      let resolveImport = (specifier: string, referrer: string) =>
        /^\.{0,2}\//.test(specifier)
          ? new URL(specifier, referrer).href
          : new URL(specifier).href;
      // deno-lint-ignore ban-types
      const redirects: Record<string, string> = { __proto__: null } as {};
      build.onStart(async () => {
        const { load: innerLoad } = createCache({
          allowRemote,
          cacheSetting,
          root: denoDir,
          vendorRoot: vendorDir,
        });
        load = async (specifier) => {
          const res = await innerLoad(specifier);
          if (res?.kind === "module" && Array.isArray(res.content)) {
            res.content = new Uint8Array(res.content);
          }
          return res;
        };
        if (importMapURL !== undefined) {
          const res = await load(importMapURL);
          if (res?.kind !== "module") {
            throw new TypeError("Failed to load import map");
          }
          const json = typeof res.content === "string"
            ? res.content
            : decoder.decode(res.content);
          const importMap = await parseFromJson(importMapURL, json);
          resolveImport = importMap.resolve.bind(importMap);
        }
      });
      build.onResolve(
        { filter: /(?:)/ },
        async ({ path, importer, namespace, resolveDir, kind }) => {
          if (kind === "entry-point" && namespace === "file") {
            const root = toFileUrl(resolve(resolveDir, path)).href;
            const graph = await createGraph(root, {
              kind: "codeOnly",
              load,
              resolve: resolveImport,
            });
            Object.assign(redirects, graph.redirects);
          }
          if (
            !((namespace === "file" || namespace === "remote") &&
              (kind === "import-statement" || kind === "dynamic-import"))
          ) {
            return null;
          }
          const resolved = (() => {
            const referrer = namespace === "file"
              ? toFileUrl(importer).href
              : importer;
            try {
              return resolveImport(path, referrer);
            } catch {
              return null;
            }
          })();
          if (resolved === null) {
            return null;
          }
          const actual = new URL(redirects[resolved] ?? resolved);
          switch (actual.protocol) {
            case "http:":
            case "https:":
              return { path: actual.href, namespace: "remote" };
            case "npm:": {
              const { name, path } = parseNpmSpecifier(actual.pathname);
              return await build.resolve(`${name}${path}`, {
                importer,
                resolveDir: nodeResolutionRootDir ?? resolveDir,
                kind: "import-statement",
              });
            }
            default:
              return { path: fromFileUrl(actual), namespace: "file" };
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
          const mod = parseModule(res.specifier, new Uint8Array(), {
            headers: res.headers,
          });
          return {
            contents: res.content,
            loader: loaders.get(mod.mediaType ?? "Unknown"),
          };
        },
      );
    },
  };
}
