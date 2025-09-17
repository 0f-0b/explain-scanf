#!/usr/bin/env -S deno run -A

/* @jsxRuntime automatic */
/* @jsxImportSource hastscript */

import { denoPlugin } from "@deno/esbuild-plugin";
import { parseFromJson } from "@deno/import-map";
import { encodeBase64Url } from "@std/encoding/base64url";
import { emptyDir } from "@std/fs/empty-dir";
import { relative } from "@std/path/relative";
import { resolve } from "@std/path/resolve";
import { toFileUrl } from "@std/path/to-file-url";
import { build, stop } from "esbuild";
import { toHtml } from "hast-util-to-html";

let dev = false;
for (const arg of Deno.args) {
  if (arg === "--dev") {
    dev = true;
    continue;
  }
  console.error(`Unexpected argument '${arg}'.`);
  Deno.exit(2);
}
Deno.chdir(new URL("..", import.meta.url));
const encoder = new TextEncoder();

async function generateImportMap(
  configPath: string,
  importMapPath: string,
): Promise<undefined> {
  const importMap = await parseFromJson(
    toFileUrl(resolve(configPath)),
    await Deno.readTextFile(configPath),
    { expandImports: true },
  );
  await Deno.writeTextFile(importMapPath, importMap.toJSON());
}

async function createCacheKey(paths: string[]): Promise<string> {
  const hashAlgorithm = "SHA-1";
  const hashLength = 5;
  const hash = new Uint32Array(hashLength);
  for (const path of paths) {
    const piece = new Uint32Array(
      await crypto.subtle.digest(hashAlgorithm, encoder.encode(path)),
    );
    for (let i = 0; i < hashLength; i++) {
      hash[i] ^= piece[i];
    }
  }
  return encodeBase64Url(hash.buffer);
}

type HastTree = typeof toHtml extends (tree: infer T) => string ? T : HastTree;

async function writeHtml(path: string, tree: HastTree): Promise<undefined> {
  const html = toHtml(tree, {
    omitOptionalTags: true,
    preferUnquoted: true,
    quoteSmart: true,
    tightCommaSeparatedLists: true,
    upperDoctype: true,
  });
  await Deno.writeTextFile(path, html);
}

await generateImportMap("deno.json", "generated_import_map.json");
await emptyDir("dist");
const [js, css] = await (async () => {
  const cwd = Deno.cwd();
  const outDir = "dist";
  const outputs = new Map<string, string>();
  const inputs = ["static/main.tsx", "static/style.css"];
  try {
    const { metafile } = await build({
      bundle: true,
      splitting: true,
      metafile: true,
      outdir: outDir,
      entryNames: "[dir]/[name]-[hash]",
      entryPoints: inputs,
      plugins: [denoPlugin({ configPath: "static/deno.json" })],
      absWorkingDir: cwd,
      sourcemap: "linked",
      format: "esm",
      target: "es2024",
      minify: !dev,
      charset: "utf8",
    });
    const cacheablePaths = ["/"];
    for (
      const [path, { entryPoint, inputs }] of Object.entries(metafile.outputs)
    ) {
      const filename = relative(outDir, path);
      if (Object.keys(inputs).length !== 0) {
        cacheablePaths.push("/" + filename);
      }
      if (entryPoint !== undefined) {
        outputs.set(entryPoint, filename);
      }
    }
    const currentCacheKey = await createCacheKey(cacheablePaths);
    await build({
      bundle: true,
      outfile: "sw.js",
      entryPoints: ["static/sw.ts"],
      plugins: [denoPlugin({ configPath: "static/deno.json" })],
      absWorkingDir: cwd,
      sourcemap: "linked",
      format: "esm",
      target: "es2024",
      minify: !dev,
      charset: "utf8",
      define: {
        "CURRENT_CACHE_KEY": JSON.stringify(currentCacheKey),
        "CACHEABLE_PATHS": JSON.stringify(cacheablePaths),
      },
    });
    return inputs.map((path) => outputs.get(path)!);
  } catch {
    throw "Build failed";
  } finally {
    await stop();
  }
})();
await writeHtml(
  "index.html",
  // @ts-expect-error workaround
  <>
    {{ type: "doctype" }}
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width" />
        <meta name="description" content="Explains the magic behind fscanf." />
        <title>Explain scanf</title>
        <link rel="stylesheet" href={"/" + css} />
        <script src={"/" + js} type="module" />
      </head>
      <body>
        <div id="root" />
      </body>
    </html>
  </>,
);
await writeHtml(
  "404.html",
  // @ts-expect-error workaround
  <>
    {{ type: "doctype" }}
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width" />
        <title>404 Not Found</title>
      </head>
      <body style="text-align:center">
        <h1>404 Not Found</h1>
        <hr />nginx/1.27.3
      </body>
    </html>
  </>,
);
