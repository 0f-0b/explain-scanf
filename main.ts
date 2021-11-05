#!/usr/bin/env deno run --allow-read --allow-net --allow-env

import { json, serve, validateRequest } from "./deps/sift.ts";
import { getCode, putCode } from "./code.ts";
import { serveStatic } from "./serve-static.ts";
import { setHeader } from "./set-header.ts";
import { transformModules } from "./transform-modules.ts";

const defaultHandler = async () =>
  new Response(await Deno.readFile("index.html"), {
    headers: [
      ["content-type", "text/html; charset=utf-8"],
      ["cache-control", "public, max-age=86400"],
    ],
  });
serve({
  "/api/code": async (req) => {
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
    return json({ id: await putCode({ format, input }) }, { status: 201 });
  },
  "/api/code/:id": async (req, params) => {
    const { error } = await validateRequest(req, {
      GET: {},
    });
    if (error) {
      return json({ error: error.message }, { status: error.status });
    }
    const { id } = params as { id: string };
    const code = await getCode(id);
    if (!code) {
      return json({ error: "Code not found" }, { status: 404 });
    }
    const { format, input } = code;
    return json({ format, input }, { status: 200 });
  },
  "/esm.sh/:filename+": serveStatic("static/esm.sh", {
    fallback: defaultHandler,
    intervene: [
      setHeader("cache-control", "public, max-age=604800, immutable"),
    ],
  }),
  "/:filename+": serveStatic("static", {
    fallback: defaultHandler,
    intervene: [
      transformModules,
      setHeader("cache-control", "public, max-age=86400"),
    ],
  }),
  404: defaultHandler,
});
