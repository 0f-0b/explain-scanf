import { transform } from "https://deno.land/x/swc@0.1.4/mod.ts";
import type {
  Config,
  ParserConfig,
  TerserMangleOptions,
} from "https://cdn.jsdelivr.net/npm/@swc/core@1.2.106/types.d.ts";

const scriptTypes = new Map<string, ParserConfig>([
  ["js", { syntax: "ecmascript" }],
  ["jsx", { syntax: "ecmascript", jsx: true }],
  ["ts", { syntax: "typescript" }],
  ["tsx", { syntax: "typescript", tsx: true }],
]);

export async function transformModules(
  req: Request,
  res: Response,
): Promise<Response> {
  const path = req.url;
  const extension = path.substring(path.lastIndexOf(".") + 1).toLowerCase();
  const parser = scriptTypes.get(extension);
  if (!parser) {
    return res;
  }
  const config: Config = {
    jsc: {
      parser,
      target: "es2020",
      minify: {
        compress: { toplevel: true },
        mangle: { toplevel: true } as TerserMangleOptions,
      },
    },
    minify: true,
  };
  const { code } = transform(await res.text(), config as never);
  const headers = new Headers(res.headers);
  headers.set("content-type", "text/javascript; charset=utf-8");
  return new Response(code, { headers });
}
