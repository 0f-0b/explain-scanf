#!/usr/bin/env deployctl run --libs=ns,fetchevent

import { getCode, putCode } from "./code.ts";
import { json, serve, validateRequest } from "./deps/sift.ts";
import { notFound } from "./util.ts";

serve({
  async ["/code"](req) {
    const { error, body } = await validateRequest(req, {
      POST: {
        body: ["format", "input"]
      }
    });
    if (error)
      return json({ error: error.message }, { status: error.status });
    const { format, input } = body as { format: string; input: string; };
    if (typeof format !== "string" || typeof input !== "string")
      return json({ error: "invalid code" }, { status: 400 });
    return json({ id: await putCode(format, input) }, { status: 201 });
  },
  async ["/code/:id"](req, params) {
    const { error } = await validateRequest(req, {
      GET: {}
    });
    if (error)
      return json({ error: error.message }, { status: error.status });
    const { id } = params as { id: string; };
    const code = await getCode(id);
    if (code === undefined)
      return notFound();
    const { format, input } = code;
    return json({ format, input }, { status: 200 });
  },
  404: notFound
});
