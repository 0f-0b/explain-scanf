import { type CacheSetting, createCache } from "@deno/cache-dir";
import { createGraph, init, type LoadResponse, parseModule } from "@deno/graph";
import { parseFromJson } from "@deno/import-map";
import { SEPARATOR } from "@std/path/constants";
import { fromFileUrl } from "@std/path/from-file-url";
import { resolve } from "@std/path/resolve";
import { toFileUrl } from "@std/path/to-file-url";
import type { Loader, Plugin } from "esbuild";

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

function optionAsPath(pathOrURL: string | URL | undefined): string | undefined {
  return pathOrURL === undefined ? undefined : asPath(pathOrURL);
}

function optionAsURL(url: string | URL | undefined): string | undefined {
  return url === undefined ? undefined : new URL(url).href;
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
  expandImportMap?: boolean;
  nodeResolutionRootDir?: string | URL;
}

export function denoCachePlugin(options?: DenoCachePluginOptions): Plugin {
  const allowRemote = options?.allowRemote;
  const cacheSetting = options?.cacheSetting;
  const denoDir = optionAsPath(options?.denoDir);
  const vendorDir = optionAsPath(options?.vendorDir);
  const importMapURL = optionAsURL(options?.importMapURL);
  const expandImportMap = options?.expandImportMap;
  const nodeResolutionRootDir = optionAsPath(options?.nodeResolutionRootDir);
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
        ({ load } = createCache({
          allowRemote,
          cacheSetting,
          root: denoDir,
          vendorRoot: vendorDir,
        }));
        if (importMapURL !== undefined) {
          const res = await load(importMapURL);
          if (res?.kind !== "module") {
            throw new TypeError("Failed to load import map");
          }
          const json = typeof res.content === "string"
            ? res.content
            : decoder.decode(res.content);
          const importMap = await parseFromJson(importMapURL, json, {
            expandImports: expandImportMap,
          });
          resolveImport = importMap.resolve.bind(importMap);
        }
      });
      build.onResolve(
        { filter: /(?:)/ },
        async ({ path, importer, namespace, resolveDir, kind }) => {
          if (resolveDir.split(SEPARATOR).includes("node_modules")) {
            return null;
          }
          if (kind === "entry-point" && namespace === "file") {
            const root = toFileUrl(resolve(resolveDir, path)).href;
            const graph = await createGraph(root, {
              kind: "codeOnly",
              load: async (specifier) => {
                const res = await load(specifier);
                return res && { ...res };
              },
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
          const referrer = namespace === "file"
            ? toFileUrl(importer).href
            : importer;
          const resolved = resolveImport(path, referrer);
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
          const mod = await parseModule(res.specifier, new Uint8Array(), {
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
