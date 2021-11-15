/// <reference lib="deno.url" />
import { compress as brotli } from "./deps/brotli.ts";
import { MRUCache } from "./deps/cache/mru.ts";
import { deflate, gzip } from "./deps/denoflate.ts";
import { Cache, CachedResponse } from "./deps/httpcache.ts";
import { preferredEncodings } from "./deps/negotiator/encoding.ts";
import type {
  ConnInfo,
  Handler as StdHandler,
} from "./deps/std/http/server.ts";
import type { Awaitable } from "./util.ts";

export function json(obj: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  if (!headers.has("content-type")) {
    headers.append("content-type", "application/json; charset=utf-8");
  }
  return new Response(JSON.stringify(obj) + "\n", {
    ...init,
    headers,
  });
}

export type ContextConsumer<T, R> = (req: Request, ctx: T) => R;
export type Handler<T> = ContextConsumer<T, Awaitable<Response>>;

export function toStdHandler(handler: Handler<{ conn: ConnInfo }>): StdHandler {
  return (req, conn) =>
    new Promise((resolve) => resolve(handler(req, { conn })));
}

export function logTime<T>(handler: Handler<T>): Handler<T> {
  return async (req, ctx) => {
    const start = Date.now();
    const res = await handler(req, ctx);
    const end = Date.now();
    const rt = `${end - start}ms`;
    res.headers.append("x-response-time", rt);
    console.log(`${req.method} ${req.url} ${rt} ${res.status}`);
    return res;
  };
}

export function catchError<T>(handler: Handler<T>): Handler<T> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e: unknown) {
      console.error(e);
      return json({ error: String(e) }, { status: 500 });
    }
  };
}

export function compress<T>(handler: Handler<T>): Handler<T> {
  const encodings: Record<string, (buf: Uint8Array) => Uint8Array> = {
    br: brotli,
    gzip: gzip as never,
    deflate: deflate as never,
    identity: (x) => x,
  };
  const provided = Object.keys(encodings);
  return async (req, ctx) => {
    const res = await handler(req, ctx);
    const body = await res.arrayBuffer();
    const accept = req.headers.get("accept-encoding");
    const [encoding] = preferredEncodings(accept, provided);
    const compressed = encodings[encoding](new Uint8Array(body));
    res.headers.append("content-encoding", encoding);
    res.headers.append("vary", "accept-encoding");
    return new Response(compressed, res);
  };
}

export function cache<T>(maxSize: number, handler: Handler<T>): Handler<T> {
  const storage = new MRUCache<string, CachedResponse>(undefined, {
    ksize: (url) => url.length * 2,
    vsize: (res) => res.body.length,
    maxsize: maxSize,
  });
  const cache = new Cache({
    get(url) {
      return Promise.resolve(storage.get(url));
    },
    set(url, res) {
      storage.set(url, res);
      return Promise.resolve();
    },
    delete(url) {
      storage.delete(url);
      return Promise.resolve();
    },
    close() {
      storage.release();
    },
  });
  return async (req, ctx) => {
    const cached = await cache.match(req);
    if (cached) {
      cached.headers.append("x-function-cache-hit", "true");
      return cached;
    }
    const res = await handler(req, ctx);
    await cache.put(req, res);
    return res;
  };
}

export function route<T>(
  routes: Record<string, Handler<T & { params: Record<string, string> }>>,
  fallback: Handler<T>,
): Handler<T> {
  const routeArray: {
    pattern: URLPattern;
    handler: Handler<T & { params: Record<string, string> }>;
  }[] = [];
  for (const path in routes) {
    routeArray.push({
      pattern: new URLPattern({ pathname: path }),
      handler: routes[path],
    });
  }
  return async (req, ctx) => {
    const url = new URL(req.url);
    for (const { pattern, handler } of routeArray) {
      const match = pattern.exec(url);
      if (match) {
        return await handler(req, {
          ...ctx,
          params: match.pathname.groups,
        });
      }
    }
    return await fallback(req, ctx);
  };
}

export function methods<T>(methods: Record<string, Handler<T>>): Handler<T> {
  const methodMap = new Map<string, Handler<T>>();
  for (const method in methods) {
    methodMap.set(method, methods[method]);
  }
  return (req, ctx) => {
    const handler = methodMap.get(req.method);
    if (!handler) {
      return json(
        { error: `Method ${req.method} is not allowed for the URL` },
        { status: 405 },
      );
    }
    return handler(req, ctx);
  };
}
