#!/usr/bin/env deno run --allow-read --allow-net --allow-env

import { extname, join } from "https://deno.land/std@0.114.0/path/mod.ts";
import { contentType } from "https://deno.land/x/media_types@v2.10.2/mod.ts";
import {
  json,
  serve,
  validateRequest,
} from "https://deno.land/x/sift@0.4.2/mod.ts";
import { transform } from "https://deno.land/x/swc@0.1.4/mod.ts";
import { getCode, putCode } from "./code.ts";

const scriptTypes = Object.freeze<Record<string, unknown>>({
  js: { syntax: "ecmascript" },
  jsx: { syntax: "ecmascript", jsx: true },
  ts: { syntax: "typescript" },
  tsx: { syntax: "typescript", tsx: true },
});

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
    return json({ id: await putCode({ format, input }) }, { status: 201 });
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
    if (!code) {
      return json({ error: "Code not found" }, { status: 404 });
    }
    const { format, input } = code;
    return json({ format, input }, { status: 200 });
  },
  "/favicon.ico"() {
    return new Response(null, { status: 404 });
  },
  async 404(req) {
    try {
      const url = new URL(req.url);
      const path = url.pathname;
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
      if (!parser) {
        return new Response(data, {
          headers: [
            ["content-type", contentType(ext) ?? "application/octet-stream"],
            ["cache-control", "max-age=2592000, immutable"],
          ],
        });
      }
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
      return new Response(code, {
        headers: [
          ["content-type", "text/javascript; charset=utf-8"],
          ["cache-control", "max-age=2592000, immutable"],
        ],
      });
    } catch {
      return new Response(await Deno.readTextFile("index.html"), {
        headers: [
          ["content-type", "text/html; charset=utf-8"],
          ["cache-control", "no-cache"],
        ],
      });
    }
  },
});
