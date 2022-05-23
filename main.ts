#!/usr/bin/env -S deno run -A

import { contentType as _contentType } from "./deps/media_types.ts";
import { serve } from "./deps/std/http/server.ts";
import { extname, join } from "./deps/std/path.ts";
import { Code, getCode, putCode } from "./code.ts";
import {
  cache,
  catchError,
  logTime,
  methods,
  route,
  toStdHandler,
} from "./handler.ts";

function contentType(path: string): string {
  return _contentType(extname(path)) ?? "application/octet-stream";
}

async function html(status?: number): Promise<Response> {
  return new Response(await Deno.readTextFile("index.html"), {
    status,
    headers: [
      ["content-type", "text/html; charset=utf-8"],
      ["cache-control", "no-cache"],
    ],
  });
}

async function robots(): Promise<Response> {
  return new Response(await Deno.readTextFile("robots.txt"), {
    headers: [
      ["content-type", "text/plain; charset=utf-8"],
      ["cache-control", "no-cache"],
    ],
  });
}

async function staticFile(path: string): Promise<Response> {
  return new Response(await Deno.readFile(path), {
    headers: [
      ["content-type", contentType(path)],
      ["cache-control", "max-age=2592000, immutable"],
    ],
  });
}

await serve(toStdHandler(logTime(catchError(cache(
  0x100000,
  route(
    {
      "/": () => html(),
      "/c/:id": () => html(),
      "/robots.txt": () => robots(),
      "/api/code": methods({
        POST: async (req) => {
          let code: Code;
          try {
            code = Code.create(await req.json());
          } catch (e: unknown) {
            if (!(e instanceof Error)) {
              throw e;
            }
            return Response.json({ error: e.message }, { status: 400 });
          }
          return Response.json({ id: await putCode(code) }, { status: 201 });
        },
      }),
      "/api/code/:id": methods({
        GET: async (_, { params: { id } }) => {
          const code = await getCode(id);
          if (!code) {
            return Response.json({ error: "Code not found" }, { status: 404 });
          }
          return Response.json(code, { status: 200 });
        },
      }),
    },
    async (req) => {
      try {
        return await staticFile(join("dist", new URL(req.url).pathname));
      } catch {
        return await html(404);
      }
    },
  ),
)))));
