#!/usr/bin/env deno run --allow-read --allow-net --allow-env

import type {
  Handler,
  ServeStaticOptions,
} from "https://deno.land/x/sift@0.4.2/mod.ts";
import {
  json,
  serve,
  serveStatic,
  validateRequest,
} from "https://deno.land/x/sift@0.4.2/mod.ts";
import { getCode, putCode } from "./code.ts";
import { transformModules } from "./transform-modules.ts";

const baseUrl = `file://${Deno.cwd()}/`;

const defaultHandler: Handler = async () =>
  new Response(await Deno.readFile("index.html"), {
    headers: [
      ["content-type", "text/html; charset=utf-8"],
    ],
  });

function staticHandler(path: string, options: ServeStaticOptions): Handler {
  const handler = serveStatic(path, options);
  return async (req, params) => {
    try {
      return await handler(req, params);
    } catch (e: unknown) {
      if (e instanceof Deno.errors.NotFound) {
        return await defaultHandler(req, params);
      }
      throw e;
    }
  };
}

serve({
  async "/api/code"(req) {
    const { error, body } = await validateRequest(req, {
      POST: {
        body: ["format", "input"],
      },
    });
    if (error) {
      return json({ error: error.message }, { status: error.status });
    }
    const { format, input } = body!;
    if (typeof format !== "string" || typeof input !== "string") {
      return json({ error: "Invalid code" }, { status: 400 });
    }
    return json({ id: await putCode(format, input) }, { status: 201 });
  },
  async "/api/code/:id"(req, params) {
    const { error } = await validateRequest(req, {
      GET: {},
    });
    if (error) {
      return json({ error: error.message }, { status: error.status });
    }
    const { id } = params as { id: string };
    const code = await getCode(id);
    if (code === undefined) {
      return json({ error: "Code not found" }, { status: 404 });
    }
    const { format, input } = code;
    return json({ format, input }, { status: 200 });
  },
  "/esm.sh/:filename+": staticHandler("static/esm.sh", {
    baseUrl,
  }),
  "/:filename+": staticHandler("static", {
    baseUrl,
    intervene: transformModules,
  }),
  404: defaultHandler,
});
