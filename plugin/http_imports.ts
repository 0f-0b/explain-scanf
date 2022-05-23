import { createCache } from "../deps/deno_cache.ts";
import { createGraph, MediaType } from "../deps/deno_graph.ts";
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
  return {
    name,
    setup(build) {
      const { cacheInfo, load } = createCache();
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
          const graph = await createGraph(path, { cacheInfo, load });
          const [root] = graph.roots;
          const mod = graph.modules.find(({ specifier }) => specifier === root);
          return mod && {
            contents: mod.source,
            loader: loaders.get(mod.mediaType),
          };
        },
      );
    },
  };
})();
