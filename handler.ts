import { errors, isHttpError } from "./deps/std/http/http_errors.ts";
import { Status } from "./deps/std/http/http_status.ts";
import { ZodError, type ZodType, type ZodTypeDef } from "./deps/zod.ts";

import { settled, type Awaitable } from "./async.ts";
import { fail } from "./fail.ts";

export * from "./deps/std/http/http_errors.ts";
export * from "./deps/std/http/http_status.ts";
type Simplify<T> = Omit<T, never>;
type Merge<T, U> = Simplify<Omit<T, keyof U> & U>;
export type ContextConsumer<C, R> = (req: Request, ctx: C) => R;
export type Handler<C> = ContextConsumer<C, Awaitable<Response>>;
export type RootHandler = Handler<{ readonly conn: Deno.ServeHandlerInfo }>;

export function toStdHandler(handler: RootHandler): Deno.ServeHandler {
  return async (req, conn) => await handler(req, { conn });
}

export const onError = (error: unknown): Response => {
  console.error(error);
  return Response.json({ error: "Internal server error" }, {
    status: Status.InternalServerError,
  });
};

export function logTime<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    const start = performance.now();
    const result = await settled(handler(req, ctx));
    const end = performance.now();
    const rt = (end - start).toFixed(1);
    if (result.status === "rejected") {
      const error = result.reason;
      console.warn(`${req.method} ${req.url} - ${rt} ms - ${error}`);
      throw error;
    }
    const res = result.value;
    res.headers.append("server-timing", `rt;dur=${rt}`);
    console.log(`${req.method} ${req.url} - ${rt} ms - ${res.status}`);
    return res;
  };
}

export function reportHttpErrors<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (isHttpError(e)) {
        const { message, status, headers } = e;
        return Response.json({ error: message }, { status, headers });
      }
      throw e;
    }
  };
}

export function route<C>(
  routes: {
    readonly [pathname: string]: Handler<
      Merge<C, { readonly params: Record<string, string | undefined> }>
    >;
  },
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
        {
          headers: [
            ["allow", Array.from(methodMap.keys()).join(", ")],
          ],
        },
      ),
    );
    return handler(req, ctx);
  };
}

export function parseBodyAsJson<T, C>(
  T: ZodType<T, ZodTypeDef, unknown>,
  handler: Handler<Merge<C, { readonly body: T }>>,
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
