import { join } from "@std/path/join";

import { Code, getCode, putCode } from "./code.ts";
import { fail } from "./fail.ts";
import {
  type Handler,
  HttpError,
  logTime,
  methods,
  parseBodyAsJson,
  reportHttpErrors,
  route,
  STATUS_CODE,
} from "./handler.ts";
import { decodeURLPathComponents, staticFile } from "./static.ts";

export function getHandler(kv: Deno.Kv): Handler {
  return logTime(reportHttpErrors(route({
    "/": () => staticFile("index.html"),
    "/c/:id": () => staticFile("index.html"),
    "/robots.txt": () => staticFile("robots.txt"),
    "/api/*": route({
      "/code": methods({
        POST: parseBodyAsJson(Code, async (_, { body: code }) => {
          const id = await putCode(kv, code);
          return Response.json({ id }, { status: STATUS_CODE.Created });
        }),
      }),
      "/code/:id": methods({
        GET: async (_, { params: { id } }) => {
          const code = await getCode(kv, id!) ??
            fail(new HttpError("Code not found", "NotFound"));
          return Response.json({ code });
        },
      }),
    }, () => fail(new HttpError("Not found", "NotFound"))),
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
    return await staticFile("404.html", { status: STATUS_CODE.NotFound });
  })));
}
