#!/usr/bin/env -S deno run --allow-read --allow-net --allow-env

import { contentType } from "./deps/media_types.ts";
import { serve } from "./deps/std/http/server.ts";
import { extname, join } from "./deps/std/path.ts";
import { transform } from "./deps/swc.ts";
import { Code, getCode, putCode } from "./code.ts";
import {
  cache,
  catchError,
  compress,
  json,
  logTime,
  methods,
  route,
  toStdHandler,
} from "./handler.ts";

const scriptTypes = Object.freeze<Record<string, unknown>>({
  js: { syntax: "ecmascript" },
  jsx: { syntax: "ecmascript", jsx: true },
  ts: { syntax: "typescript" },
  tsx: { syntax: "typescript", tsx: true },
});

async function html(status?: number): Promise<Response> {
  return new Response(await Deno.readTextFile("index.html"), {
    status,
    headers: [
      ["content-type", "text/html; charset=utf-8"],
      ["cache-control", "no-cache"],
    ],
  });
}

await serve(toStdHandler(logTime(catchError(cache(
  0x100000,
  compress(route(
    {
      "/": () => html(),
      "/c/:id": () => html(),
      "/api/code": methods({
        POST: async (req) => {
          let code: Code;
          try {
            code = Code.create(await req.json());
          } catch (e: unknown) {
            if (!(e instanceof Error)) {
              throw e;
            }
            return json({ error: e.message }, { status: 400 });
          }
          return json({ id: await putCode(code) }, { status: 201 });
        },
      }),
      "/api/code/:id": methods({
        GET: async (_, { params: { id } }) => {
          const code = await getCode(id);
          if (!code) {
            return json({ error: "Code not found" }, { status: 404 });
          }
          return json(code, { status: 200 });
        },
      }),
    },
    async (req) => {
      try {
        const path = new URL(req.url).pathname;
        const data = await Deno.readFile(join("static", path));
        if (path.startsWith("/esm.sh/")) {
          return new Response(data, {
            headers: [
              ["content-type", "text/javascript; charset=utf-8"],
              ["cache-control", "max-age=2592000, immutable"],
            ],
          });
        }
        const ext = extname(path);
        const parser = scriptTypes[ext.substring(1)];
        if (parser) {
          const { code } = transform(new TextDecoder().decode(data), {
            jsc: {
              parser,
              target: "es2020",
              minify: {
                compress: { toplevel: true },
                mangle: { toplevel: true },
              },
            },
            minify: true,
          } as never);
          return new Response(code + "\n", {
            headers: [
              ["content-type", "text/javascript; charset=utf-8"],
              ["cache-control", "max-age=2592000, immutable"],
            ],
          });
        }
        return new Response(data, {
          headers: [
            ["content-type", contentType(ext) ?? "application/octet-stream"],
            ["cache-control", "max-age=2592000, immutable"],
          ],
        });
      } catch {
        return await html(404);
      }
    },
  )),
)))));
