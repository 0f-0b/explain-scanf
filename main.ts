#!/usr/bin/env -S deno run --allow-read=. --allow-net=0.0.0.0,graphql.fauna.com --allow-env=FAUNA_SECRET

import { onError, toStdHandler } from "./handler.ts";
import { handler } from "./server.ts";

const server = Deno.serve({
  handler: toStdHandler(handler),
  onError,
});
await server.finished;
