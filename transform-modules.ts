import { transform } from "https://deno.land/x/swc@0.1.4/mod.ts";
import type { InterveneFunction } from "./serve-static.ts";

const scriptTypes = Object.freeze<Record<string, unknown>>({
  js: { syntax: "ecmascript" },
  jsx: { syntax: "ecmascript", jsx: true },
  ts: { syntax: "typescript" },
  tsx: { syntax: "typescript", tsx: true },
});

export const transformModules: InterveneFunction = async (req, res) => {
  const path = req.url;
  const extension = path.substring(path.lastIndexOf(".") + 1).toLowerCase();
  const parser = scriptTypes[extension];
  if (!parser) {
    return res;
  }
  const { code } = transform(await res.text(), {
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
  const headers = new Headers(res.headers);
  headers.set("content-type", "text/javascript; charset=utf-8");
  return new Response(code, { headers });
};
