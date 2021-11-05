import type { Handler } from "./deps/sift.ts";
import { serveStatic as _serveStatic } from "./deps/sift.ts";
import type { Awaitable } from "./util.ts";

const baseUrl = `file://${Deno.cwd()}/`;

export type InterveneFunction = (
  request: Request,
  response: Response,
) => Awaitable<Response>;

export interface ServeStaticOptions {
  fallback: Handler;
  intervene?: InterveneFunction[];
  cache?: boolean;
}

export function serveStatic(
  path: string,
  { fallback, intervene, cache }: ServeStaticOptions,
): Handler {
  const handler = _serveStatic(path, {
    baseUrl,
    intervene: intervene
      ? async (req, res) => {
        for (const fn of intervene) {
          res = await fn(req, res);
        }
        return res;
      }
      : undefined,
    cache,
  });
  return async (req, params) => {
    try {
      return await handler(req, params);
    } catch (e: unknown) {
      if (e instanceof Deno.errors.NotFound) {
        return await fallback(req, params);
      }
      throw e;
    }
  };
}
