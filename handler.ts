import type {
  ConnInfo,
  Handler as StdHandler,
} from "./deps/std/http/server.ts";
import { errors, HttpError } from "./deps/std/http/http_errors.ts";
import { type Awaitable, settled } from "./async.ts";
import { fail } from "./fail.ts";

type Simplify<T> = Omit<T, never>;
type Merge<T, U> = Simplify<Omit<T, keyof U> & U>;
export type ContextConsumer<T, R> = (req: Request, ctx: T) => R;
export type Handler<T> = ContextConsumer<T, Awaitable<Response>>;

export function toStdHandler(handler: Handler<{ conn: ConnInfo }>): StdHandler {
  return async (req, conn) => await handler(req, { conn });
}

export const onError = (error: unknown): Response => {
  if (!(error instanceof HttpError)) {
    console.error(error);
    error = new errors.InternalServerError("Internal server error");
  }
  const { message, status } = error as HttpError;
  return Response.json({ error: message }, { status });
};

export function logTime<T>(handler: Handler<T>): Handler<T> {
  return async (req, ctx) => {
    const start = performance.now();
    const result = await settled(handler(req, ctx));
    const end = performance.now();
    const rt = `${(end - start).toFixed(1)}ms`;
    if (result.status === "rejected") {
      const error = result.reason;
      console.warn(`${req.method} ${req.url} ${rt} ${error}`);
      throw error;
    }
    const res = result.value;
    res.headers.append("x-response-time", rt);
    console.log(`${req.method} ${req.url} ${rt} ${res.status}`);
    return res;
  };
}

export function route<T>(
  routes: Record<string, Handler<Merge<T, { params: Record<string, string> }>>>,
  fallback: Handler<T>,
): Handler<T> {
  const entries = Object.entries(routes).map(([pathname, handler]) => ({
    pattern: new URLPattern({ pathname }),
    handler,
  }));
  return async (req, ctx) => {
    const url = new URL(req.url);
    for (const { pattern, handler } of entries) {
      const match = pattern.exec(url);
      if (match) {
        return await handler(req, { ...ctx, params: match.pathname.groups });
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
    const handler = methodMap.get(req.method) ?? fail(
      new errors.MethodNotAllowed(
        `Method ${req.method} is not allowed for the URL`,
      ),
    );
    return handler(req, ctx);
  };
}
