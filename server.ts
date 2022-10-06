import { join } from "./deps/std/path.ts";
import { StructError } from "./deps/superstruct.ts";

import { Code, getCode, putCode } from "./code.ts";
import { fail } from "./fail.ts";
import {
  type ConnInfo,
  errors,
  type Handler,
  logTime,
  methods,
  route,
  Status,
} from "./handler.ts";
import { staticFile } from "./static.ts";

export const handler: Handler<{ conn: ConnInfo }> = logTime(route({
  "/": () => staticFile("index.html"),
  "/c/:id": () => staticFile("index.html"),
  "/robots.txt": () => staticFile("robots.txt"),
  "/api/*": route({
    "/code": methods({
      POST: async (req) => {
        const code = await (async () => {
          try {
            return Code.create(await req.json());
          } catch (e) {
            if (e instanceof SyntaxError || e instanceof StructError) {
              throw new errors.BadRequest(e.message);
            }
            throw e;
          }
        })();
        return Response.json({ id: await putCode(code) }, {
          status: Status.Created,
        });
      },
    }),
    "/code/:id": methods({
      GET: async (_, { params: { id } }) => {
        const code = await getCode(id) ??
          fail(new errors.NotFound("Code not found"));
        return Response.json({ code });
      },
    }),
  }, () => fail(new errors.NotFound("Not found"))),
}, async (req) => {
  const path = (() => {
    try {
      return decodeURIComponent(new URL(req.url).pathname);
    } catch {
      throw new errors.BadRequest("Malformed path");
    }
  })();
  try {
    return await staticFile(join("dist", path), {
      cacheControl: "max-age=2592000, immutable",
    });
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      return await staticFile("index.html", {
        status: Status.NotFound,
      });
    }
    throw e;
  }
}));
