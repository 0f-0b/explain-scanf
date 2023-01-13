import { errors, HttpError, isHttpError } from "./deps/std/http/http_errors.ts";
import { Status } from "./deps/std/http/http_status.ts";
import type {
  ConnInfo,
  Handler as StdHandler,
} from "./deps/std/http/server.ts";
import { ZodError, type ZodType } from "./deps/zod.ts";

import { type Awaitable, settled } from "./async.ts";
import { fail } from "./fail.ts";

export * from "./deps/std/http/http_errors.ts";
export * from "./deps/std/http/http_status.ts";
export type { ConnInfo };
type Simplify<T> = Omit<T, never>;
type Merge<T, U> = Simplify<Omit<T, keyof U> & U>;
export type ContextConsumer<C, R> = (req: Request, ctx: C) => R;
export type Handler<C> = ContextConsumer<C, Awaitable<Response>>;
export type RootHandler = Handler<{ conn: ConnInfo }>;

export function toStdHandler(handler: RootHandler): StdHandler {
  return async (req, conn) => await handler(req, { conn });
}

export const onError = (error: unknown): Response => {
  if (!isHttpError(error)) {
    console.error(error);
    error = new errors.InternalServerError("Internal server error");
  }
  const { message, status } = error as HttpError;
  return Response.json({ error: message }, { status });
};

export function logTime<C>(handler: Handler<C>): Handler<C> {
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

export function route<C>(
  routes: Record<string, Handler<Merge<C, { params: Record<string, string> }>>>,
  fallback: Handler<C>,
): Handler<C> {
  const entries = Object.entries(routes).map(([pathname, handler]) => ({
    pattern: new URLPattern({ pathname }),
    handler,
  }));
  return async (req, ctx) => {
    const url = new URL(req.url);
    const path = (ctx as { params?: { 0?: string } }).params?.[0];
    if (path !== undefined) {
      url.pathname = path;
    }
    for (const { pattern, handler } of entries) {
      const match = pattern.exec(url);
      if (match) {
        return await handler(req, { ...ctx, params: match.pathname.groups });
      }
    }
    return await fallback(req, ctx);
  };
}

export function methods<C>(methods: Record<string, Handler<C>>): Handler<C> {
  const methodMap = new Map<string, Handler<C>>();
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

export function parseBodyAsJson<T, C>(
  T: ZodType<T>,
  handler: Handler<Merge<C, { body: T }>>,
): Handler<C> {
  return async (req, ctx) => {
    let body: T;
    try {
      body = T.parse(await req.json());
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new errors.BadRequest(e.message);
      }
      if (e instanceof ZodError) {
        return Response.json({ error: "Cannot parse body", issues: e.issues }, {
          status: Status.BadRequest,
        });
      }
      throw e;
    }
    return await handler(req, { ...ctx, body });
  };
}
