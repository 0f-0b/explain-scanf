#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net --allow-env --allow-run

/* @jsx h */
import { build, initialize, stop } from "../deps/esbuild.ts";
import { toHtml } from "../deps/hast_util_to_html.ts";
import { h } from "../deps/hastscript.ts";
import { emptyDir } from "../deps/std/fs/empty_dir.ts";
import { relative } from "../deps/std/path/relative.ts";
import { resolve } from "../deps/std/path/resolve.ts";
import { toFileUrl } from "../deps/std/path/to_file_url.ts";

import { denoCachePlugin } from "../esbuild_deno_cache_plugin.ts";

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
await initialize({});
await emptyDir("dist");
const [js, css] = await (async () => {
  const outDir = "dist";
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
        importMapURL: toFileUrl(resolve("static/import_map.json")),
      })],
      absWorkingDir: Deno.cwd(),
      sourcemap: "linked",
      format: "esm",
      target: "es2020",
      supported: { "nesting": false },
      minify: !dev,
      charset: "utf8",
    });
    const outputs = new Map<string, string>();
    for (const [output, { entryPoint }] of Object.entries(metafile.outputs)) {
      if (entryPoint !== undefined) {
        outputs.set(entryPoint, relative(outDir, output));
      }
    }
    return inputs.map((path) => outputs.get(path)!);
  } catch {
    Deno.exit(1);
  }
})();
stop();
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
