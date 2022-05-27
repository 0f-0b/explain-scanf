import type {
  ConnInfo,
  Handler as StdHandler,
} from "./deps/std/http/server.ts";
import type { Awaitable } from "./async.ts";

export type ContextConsumer<T, R> = (req: Request, ctx: T) => R;
export type Handler<T> = ContextConsumer<T, Awaitable<Response>>;

export function toStdHandler(handler: Handler<{ conn: ConnInfo }>): StdHandler {
  return async (req, conn) => await handler(req, { conn });
}

export function logTime<T>(handler: Handler<T>): Handler<T> {
  return async (req, ctx) => {
    const start = performance.now();
    const res = await handler(req, ctx);
    const end = performance.now();
    const rt = `${(end - start).toFixed(1)}ms`;
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
      return Response.json({ error: String(e) }, { status: 500 });
    }
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
      return Response.json(
        { error: `Method ${req.method} is not allowed for the URL` },
        { status: 405 },
      );
    }
    return handler(req, ctx);
  };
}
