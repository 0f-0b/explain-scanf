import { STATUS_CODE } from "@std/http/status";
import { ZodError, type ZodType } from "zod";

import { type Awaitable, settled } from "./async.ts";

export * from "@std/http/status";
type Merge<T, U> = Omit<T, keyof U> & U;
export type Handler<C = unknown> = (
  req: Request,
  ctx: C,
) => Awaitable<Response>;

export function toFetch(handler: Handler): (req: Request) => Promise<Response> {
  return async (req) => await handler(req, null);
}

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

export function supportedMethods<C>(
  methods: object & Iterable<string>,
  handler: Handler<C>,
): Handler<C> {
  const set = new Set(methods);
  if (set.has("GET")) {
    set.add("HEAD");
  }
  return async (req, ctx) => {
    if (!set.has(req.method)) {
      return Response.json(
        { error: `Method ${req.method} is not implemented` },
        {
          status: STATUS_CODE.NotImplemented,
          headers: [
            ["connection", "close"],
          ],
        },
      );
    }
    return await handler(req, ctx);
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
    const path = (ctx as { params?: { 0?: string } } | null)?.params?.[0];
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
  const map = new Map(Object.entries(methods));
  const get = map.get("GET");
  if (get) {
    map.set("HEAD", get);
  }
  const allow = Array.from(map.keys()).sort().join(", ");
  return async (req, ctx) => {
    const handler = map.get(req.method);
    const res = handler ? await handler(req, ctx) : Response.json(
      { error: `Method ${req.method} is not allowed for the URL` },
      { status: STATUS_CODE.MethodNotAllowed },
    );
    res.headers.append("allow", allow);
    return res;
  };
}

export function parseBodyAsJson<T, C>(
  T: ZodType<T>,
  handler: Handler<Merge<C, { readonly body: T }>>,
): Handler<C> {
  return async (req, ctx) => {
    let body: T;
    try {
      body = T.parse(await req.json());
    } catch (e) {
      if (e instanceof SyntaxError) {
        return Response.json(
          { error: e.message },
          { status: STATUS_CODE.BadRequest },
        );
      }
      if (e instanceof ZodError) {
        return Response.json(
          { error: "Cannot parse body", issues: e.issues },
          { status: STATUS_CODE.BadRequest },
        );
      }
      throw e;
    }
    return await handler(req, { ...ctx, body });
  };
}
