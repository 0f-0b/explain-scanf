import { join } from "./deps/std/path/join.ts";

import { Code, getCode, putCode } from "./code.ts";
import { fail } from "./fail.ts";
import {
  HttpError,
  logTime,
  methods,
  parseBodyAsJson,
  reportHttpErrors,
  type RootHandler,
  route,
  Status,
} from "./handler.ts";
import { decodeURLPathComponents, staticFile } from "./static.ts";

export function getHandler(kv: Deno.Kv): RootHandler {
  return logTime(reportHttpErrors(route({
    "/": () => staticFile("index.html"),
    "/c/:id": () => staticFile("index.html"),
    "/robots.txt": () => staticFile("robots.txt"),
    "/api/*": route({
      "/code": methods({
        POST: parseBodyAsJson(Code, async (_, { body: code }) => {
          const id = await putCode(kv, code);
          return Response.json({ id }, { status: Status.Created });
        }),
      }),
      "/code/:id": methods({
        GET: async (_, { params: { id } }) => {
          const code = await getCode(kv, id!) ??
            fail(new HttpError(Status.NotFound, "Code not found"));
          return Response.json({ code });
        },
      }),
    }, () => fail(new HttpError(Status.NotFound, "Not found"))),
  }, async (req) => {
    const path = decodeURLPathComponents(new URL(req.url).pathname);
    if (path) {
      try {
        return await staticFile(join("dist", ...path), {
          cacheControl: "max-age=2592000, immutable",
        });
      } catch (e) {
        if (
          !(e instanceof Deno.errors.NotFound ||
            e instanceof Deno.errors.NotADirectory ||
            e instanceof Deno.errors.IsADirectory)
        ) {
          throw e;
        }
      }
    }
    return await staticFile("index.html", { status: Status.NotFound });
  })));
}
