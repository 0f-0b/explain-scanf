#!/usr/bin/env -S deno run --unstable-http --unstable-kv --allow-read=dist,index.html,robots.txt --allow-net=0.0.0.0,graphql.fauna.com --allow-env=FAUNA_SECRET

import { onError, toStdHandler } from "./handler.ts";
import { signal } from "./interrupt_signal.ts";
import { getHandler } from "./server.ts";

if (typeof Symbol.dispose !== "symbol") {
  Object.defineProperty(Symbol, "dispose", { value: Symbol("Symbol.dispose") });
}
Object.defineProperty(Deno.Kv.prototype, Symbol.dispose, {
  value: function (this: Deno.Kv) {
    try {
      this.close();
    } catch {
      // ignored
    }
  },
  writable: true,
  configurable: true,
});
using kv = await Deno.openKv();
const server = Deno.serve({ handler: toStdHandler(getHandler(kv)), onError });
const abort = () => server.shutdown();
signal.addEventListener("abort", abort, { once: true });
try {
  await server.finished;
} finally {
  signal.removeEventListener("abort", abort);
}
