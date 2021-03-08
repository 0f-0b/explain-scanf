import type { Response, ServerRequest } from "./deps.ts";

export function getParams(req: ServerRequest): URLSearchParams {
  return new URLSearchParams(new URL(req.url, "https://localhost").search);
}

export async function getJSON(req: ServerRequest): Promise<unknown> {
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await Deno.readAll(req.body)));
  } catch (e) {
    return undefined;
  }
}

export function putJSON(req: ServerRequest, obj: unknown, res: Response = {}): Promise<void> {
  const headers = new Headers(res.headers);
  headers.append("content-type", "application/json");
  return req.respond({ ...res, headers, body: JSON.stringify(obj) });
}

export function undefinedParam(req: ServerRequest, key: string): Promise<void> {
  return req.respond({
    status: 400,
    headers: new Headers([
      ["content-type", "text/plain"]
    ]),
    body: `Bad Request: '${key}' is not defined`
  });
}

export function notFound(req: ServerRequest): Promise<void> {
  return req.respond({
    status: 404,
    headers: new Headers([
      ["content-type", "text/plain"]
    ]),
    body: "Not Found"
  });
}
