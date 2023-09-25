#!/usr/bin/env -S deno run --unstable --allow-read=dist,index.html,robots.txt --allow-net=0.0.0.0,graphql.fauna.com --allow-env=FAUNA_SECRET

import { onError, toStdHandler } from "./handler.ts";
import { signal } from "./interrupt_signal.ts";
import { getHandler } from "./server.ts";

const kv = await Deno.openKv();
try {
  const server = Deno.serve({ handler: toStdHandler(getHandler(kv)), onError });
  const onAbort = () => server.shutdown();
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    await server.finished;
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
} finally {
  kv.close();
}
