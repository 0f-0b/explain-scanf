#!/usr/bin/env deno run -A

import { encode as encodeHex } from "https://deno.land/std@0.114.0/encoding/hex.ts";
import { join } from "https://deno.land/std@0.114.0/path/mod.ts";
import { renderToStaticMarkup } from "https://esm.sh/react-dom@17.0.2/server";
import React from "https://esm.sh/react@17.0.2";

async function withHash(path: string): Promise<string> {
  const data = await Deno.readFile(join("static", path));
  const hash = await crypto.subtle.digest("SHA-256", data);
  const t = new TextDecoder().decode(encodeHex(new Uint8Array(hash, 0, 5)));
  return `${path}?t=${t}`;
}

const root = "/main.tsx";
const proc = Deno.run({
  cmd: [
    Deno.execPath(),
    "info",
    "--json",
    `static${root}`,
  ],
  stdin: "null",
  stdout: "piped",
});
const info: {
  roots: [string];
  modules: { specifier: string }[];
} = JSON.parse(new TextDecoder().decode(await proc.output()));
const prefix = info.roots[0].slice(0, -root.length);
const esmPrefix = `${prefix}/esm.sh/`;
const importMap = {
  imports: Object.fromEntries(
    await Promise.all(
      info.modules
        .filter((mod) =>
          mod.specifier.startsWith(prefix) &&
          !mod.specifier.startsWith(esmPrefix)
        )
        .map(async (mod) => {
          const path = mod.specifier.substring(prefix.length);
          return [path, await withHash(path)];
        }),
    ),
  ),
};
const esmShims =
  "https://cdn.jsdelivr.net/npm/es-module-shims@1.3.1/dist/es-module-shims.js";
const html = renderToStaticMarkup(
  <html lang="en">
    <head>
      <meta
        name="viewport"
        content="width=device-width,initial-scale=1,shrink-to-fit=no"
      />
      <title>Explain scanf</title>
      <link rel="stylesheet" href={await withHash("/style.css")} />
      <script src={esmShims} async />
    </head>
    <body>
      <main id="root" role="application" />
      <script
        type="importmap-shim"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(importMap) }}
      />
      <script
        type="module-shim"
        dangerouslySetInnerHTML={{ __html: 'import "/main.tsx"' }}
      />
    </body>
  </html>,
);
await Deno.writeTextFile("index.html", `<!DOCTYPE html>${html}\n`);
