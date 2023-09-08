#!/usr/bin/env -S deno run --unstable --allow-read=dist,index.html,robots.txt --allow-net=0.0.0.0,graphql.fauna.com --allow-env=FAUNA_SECRET

import { onError, toStdHandler } from "./handler.ts";
import { signal } from "./interrupt_signal.ts";
import { getHandler } from "./server.ts";

const kv = await Deno.openKv();
try {
  const server = Deno.serve({
    signal,
    handler: toStdHandler(getHandler(kv)),
    onError,
  });
  await Promise.all([
    server.finished,
    (async () => {
      const iter = kv.list({ prefix: ["expire"], end: ["expire", Date.now()] });
      for await (const { key } of iter) {
        kv.atomic()
          .delete(key)
          .delete(key.slice(2))
          .commit();
      }
    })(),
  ]);
} finally {
  kv.close();
}
