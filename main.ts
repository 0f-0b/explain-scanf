#!/usr/bin/env -S deno run -A

import { serve } from "./deps/std/http/server.ts";
import { contentType } from "./deps/std/media_types.ts";
import { extname, join } from "./deps/std/path.ts";
import { Code, getCode, putCode } from "./code.ts";
import {
  catchError,
  logTime,
  methods,
  route,
  toStdHandler,
} from "./handler.ts";

interface StaticFileOptions {
  status?: number;
  cacheControl?: string;
}

async function staticFile(
  path: string,
  { status, cacheControl = "no-cache" }: StaticFileOptions = {},
): Promise<Response> {
  const type = contentType(extname(path)) ?? "application/octet-stream";
  return new Response(await Deno.readFile(path), {
    status,
    headers: [
      ["content-type", type],
      ["cache-control", cacheControl],
    ],
  });
}

await serve(toStdHandler(logTime(catchError(route(
  {
    "/": () => staticFile("index.html"),
    "/c/:id": () => staticFile("index.html"),
    "/robots.txt": () => staticFile("robots.txt"),
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
        return Response.json({ code }, { status: 200 });
      },
    }),
  },
  async (req) => {
    try {
      return await staticFile(join("dist", new URL(req.url).pathname), {
        cacheControl: "max-age=2592000, immutable",
      });
    } catch {
      return await staticFile("index.html", { status: 404 });
    }
  },
)))));
