import { join } from "@std/path/join";

import { Code, getCode, putCode } from "./code.ts";
import {
  type Handler,
  logTime,
  methods,
  parseBodyAsJson,
  route,
  STATUS_CODE,
  supportedMethods,
} from "./handler.ts";
import { decodeURLPathComponents, staticFile } from "./static.ts";

export function getHandler(kv: Deno.Kv): Handler {
  return logTime(supportedMethods(
    ["GET", "POST"],
    route(
      {
        "/api/*": route({
          "/code": methods({
            POST: parseBodyAsJson(Code, async (_, { body: code }) => {
              const id = await putCode(kv, code);
              return Response.json({ id }, { status: STATUS_CODE.Created });
            }),
          }),
          "/code/:id": methods({
            GET: async (_, { params: { id } }) => {
              const code = await getCode(kv, id!);
              if (!code) {
                return Response.json(
                  { error: "Code not found" },
                  { status: STATUS_CODE.NotFound },
                );
              }
              return Response.json({ code });
            },
          }),
        }, () =>
          Response.json(
            { error: "Not found" },
            { status: STATUS_CODE.NotFound },
          )),
      },
      methods({
        GET: route({
          "/": () => staticFile("index.html"),
          "/c/:id": () => staticFile("index.html"),
          "/sw.js": () => staticFile("sw.js"),
          "/sw.js.map": () => staticFile("sw.js.map"),
          "/robots.txt": () => staticFile("robots.txt"),
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
        }),
      }),
    ),
  ));
}
