#!/usr/bin/env -S deno run -A

import { serve } from "./deps/std/http/server.ts";
import { errors } from "./deps/std/http/http_errors.ts";
import { join } from "./deps/std/path.ts";
import { StructError } from "./deps/superstruct.ts";
import { Code, getCode, putCode } from "./code.ts";
import { fail } from "./fail.ts";
import { logTime, methods, onError, route, toStdHandler } from "./handler.ts";
import { staticFile } from "./static.ts";

await serve(
  toStdHandler(logTime(route(
    {
      "/": () => staticFile("index.html"),
      "/c/:id": () => staticFile("index.html"),
      "/robots.txt": () => staticFile("robots.txt"),
      "/api/code": methods({
        POST: async (req) => {
          const code = await (async () => {
            try {
              return Code.create(await req.json());
            } catch (e: unknown) {
              if (!(e instanceof StructError)) {
                throw e;
              }
              throw new errors.BadRequest(e.message);
            }
          })();
          return Response.json({ id: await putCode(code) }, { status: 201 });
        },
      }),
      "/api/code/:id": methods({
        GET: async (_, { params: { id } }) => {
          const code = await getCode(id) ??
            fail(new errors.NotFound("Code not found"));
          return Response.json({ code });
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
  ))),
  { onError },
);
