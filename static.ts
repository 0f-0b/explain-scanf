import { contentType } from "@std/media-types/content-type";
import { extname } from "@std/path/extname";

export interface StaticFileOptions {
  status?: number;
  cacheControl?: string;
}

export async function staticFile(
  path: string,
  options?: StaticFileOptions,
): Promise<Response> {
  const contentTypeValue = contentType(extname(path));
  const file = await Deno.open(path);
  const res = new Response(file.readable, { status: options?.status });
  if (contentTypeValue) {
    res.headers.append("content-type", contentTypeValue);
  }
  res.headers.append("cache-control", options?.cacheControl ?? "no-cache");
  return res;
}

export function decodeURLPathComponents(pathname: string): string[] | null {
  const segments = pathname.split("/").filter(Boolean);
  let components: string[];
  try {
    components = segments.map(decodeURIComponent);
  } catch {
    return null;
  }
  if (components.some((component) => /[/\\]/.test(component))) {
    return null;
  }
  return components;
}
