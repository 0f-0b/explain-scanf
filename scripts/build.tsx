#!/usr/bin/env -S deno run -A

import { build, initialize, stop } from "../deps/esbuild.ts";
import { React } from "../deps/react.ts";
import { renderToStaticMarkup } from "../deps/react_dom/server.ts";
import { emptyDir } from "../deps/std/fs/empty_dir.ts";
import { relative, resolve, toFileUrl } from "../deps/std/path.ts";

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
      plugins: [denoCachePlugin(toFileUrl(resolve("static/import_map.json")))],
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
