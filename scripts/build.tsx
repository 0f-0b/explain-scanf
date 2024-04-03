#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net --allow-env --allow-run

/* @jsxImportSource hastscript */

import { encodeBase64Url } from "@std/encoding/base64url";
import { emptyDir } from "@std/fs/empty-dir";
import { relative } from "@std/path/relative";
import { resolve } from "@std/path/resolve";
import { toFileUrl } from "@std/path/to-file-url";
import { build, stop } from "esbuild";
import { toHtml } from "hast-util-to-html";

import { denoCachePlugin } from "./esbuild_deno_cache_plugin.ts";
import { expandImportMap } from "./expand_import_map.ts";

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

async function generateImportMap(
  configPath: string,
  importMapPath: string,
): Promise<undefined> {
  const config = JSON.parse(await Deno.readTextFile(configPath));
  const importMap = expandImportMap(config);
  await Deno.writeTextFile(importMapPath, JSON.stringify(importMap));
}

await generateImportMap("deno.json", "generated_import_map.json");
await generateImportMap("static/deno.json", "static/generated_import_map.json");
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
      plugins: [denoCachePlugin({
        importMapURL: toFileUrl(resolve("static/generated_import_map.json")),
      })],
      absWorkingDir: cwd,
      sourcemap: "linked",
      format: "esm",
      target: "es2020",
      supported: { "nesting": false },
      minify: !dev,
      charset: "utf8",
    });
    const outputNames: string[] = [];
    for (
      const [path, { entryPoint, inputs }] of Object.entries(metafile.outputs)
    ) {
      const filename = relative(outDir, path);
      if (Object.keys(inputs).length !== 0) {
        outputNames.push(filename);
      }
      if (entryPoint !== undefined) {
        outputs.set(entryPoint, filename);
      }
    }
    const hashAlgorithm = "SHA-1";
    const hashLength = 5;
    const xoredHash = new Uint32Array(hashLength);
    const encoder = new TextEncoder();
    for (const name of outputNames) {
      const hash = new Uint32Array(
        await crypto.subtle.digest(hashAlgorithm, encoder.encode(name)),
      );
      for (let i = 0; i < hashLength; i++) {
        xoredHash[i] ^= hash[i];
      }
    }
    await build({
      bundle: true,
      outfile: "dist/sw.js",
      entryPoints: ["static/sw.ts"],
      plugins: [denoCachePlugin()],
      absWorkingDir: cwd,
      sourcemap: "linked",
      format: "esm",
      target: "es2020",
      minify: !dev,
      charset: "utf8",
      define: {
        "CURRENT_CACHE_KEY": JSON.stringify(encodeBase64Url(xoredHash.buffer)),
        "CACHEABLE_PATHS": JSON.stringify([
          "/",
          ...outputNames.map((name) => "/" + name),
        ]),
      },
    });
    return inputs.map((path) => outputs.get(path)!);
  } catch {
    throw "Build failed";
  } finally {
    await stop();
  }
})();
const html = toHtml(
  <html lang="en">
    <head>
      <meta charset="utf-8" />
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
      <div id="root" />
    </body>
  </html>,
  {
    omitOptionalTags: true,
    preferUnquoted: true,
    quoteSmart: true,
    tightCommaSeparatedLists: true,
  },
);
await Deno.writeTextFile("index.html", `<!DOCTYPE html>${html}\n`);
