import { contentType } from "./deps/std/media_types.ts";
import { extname } from "./deps/std/path.ts";

export interface StaticFileOptions {
  status?: number;
  cacheControl?: string;
}

export async function staticFile(
  path: string,
  options?: StaticFileOptions,
): Promise<Response> {
  const extension = extname(path);
  return new Response(await Deno.readFile(path), {
    status: options?.status,
    headers: [
      ["content-type", contentType(extension) ?? "application/octet-stream"],
      ["cache-control", options?.cacheControl ?? "no-cache"],
    ],
  });
}
