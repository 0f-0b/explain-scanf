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
  const extension = extname(path);
  return new Response(await Deno.readFile(path), {
    status: options?.status,
    headers: [
      ["content-type", contentType(extension) ?? "application/octet-stream"],
      ["cache-control", options?.cacheControl ?? "no-cache"],
    ],
  });
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
