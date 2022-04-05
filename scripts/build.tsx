#!/usr/bin/env -S deno run -A

import { MediaType } from "../deps/deno_graph/media_type.ts";
import type { ModuleGraphJson } from "../deps/deno_graph/types.ts";
import { build, type Loader, type Plugin, stop } from "../deps/esbuild.ts";
import React from "../deps/react.ts";
import { renderToStaticMarkup } from "../deps/react-dom/server.ts";
import { emptyDir } from "../deps/std/fs/empty_dir.ts";
import { relative } from "../deps/std/path.ts";

async function denoInfo(path: string): Promise<ModuleGraphJson> {
  const proc = Deno.run({
    cmd: [Deno.execPath(), "info", "--json", path],
    stdout: "piped",
    stderr: "piped",
    stdin: "null",
  });
  const [status, stdout, stderr] = await Promise.all([
    proc.status(),
    proc.output(),
    proc.stderrOutput(),
  ]);
  if (!status.success) {
    throw new Error(new TextDecoder().decode(stderr).trim());
  }
  return JSON.parse(new TextDecoder().decode(stdout));
}

const httpImports: Plugin = (() => {
  const name = "http-imports";
  const loaders = new Map<MediaType | undefined, Loader>([
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
          const info = await denoInfo(path);
          const [root] = info.roots;
          const mod = info.modules.find(({ specifier }) => specifier === root);
          return mod?.local
            ? {
              contents: await Deno.readFile(mod.local),
              loader: loaders.get(mod.mediaType),
            }
            : null;
        },
      );
    },
  };
})();

async function bundle(outDir: string, inputs: string[]): Promise<string[]> {
  const { metafile } = await build({
    bundle: true,
    splitting: true,
    metafile: true,
    outdir: outDir,
    entryNames: "[dir]/[name]-[hash]",
    entryPoints: inputs,
    plugins: [httpImports],
    absWorkingDir: Deno.cwd(),
    sourcemap: "linked",
    format: "esm",
    target: "es2020",
    minify: true,
    charset: "utf8",
  });
  const outputs = new Map<string, string>();
  for (const [output, { entryPoint }] of Object.entries(metafile.outputs)) {
    if (entryPoint !== undefined) {
      outputs.set(entryPoint, relative(outDir, output));
    }
  }
  return inputs.map((path) => outputs.get(path)!);
}

Deno.chdir(new URL("..", import.meta.url));
await emptyDir("dist");
const [js, css] = await bundle("dist", ["static/main.tsx", "static/style.css"]);
stop();
const html = renderToStaticMarkup(
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta
        name="viewport"
        content="width=device-width,initial-scale=1,shrink-to-fit=no"
      />
      <meta name="description" content="Explains the magic behind fscanf." />
      <title>Explain scanf</title>
      <link rel="stylesheet" href={"/" + css} />
      <script src={"/" + js} type="module" />
    </head>
    <body>
      <main id="root" role="application" />
    </body>
  </html>,
);
await Deno.writeTextFile("index.html", `<!DOCTYPE html>${html}\n`);
