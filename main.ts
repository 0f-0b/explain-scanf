#!/usr/bin/env -S deno run --unstable-http --unstable-kv --allow-read=dist,index.html,robots.txt --allow-net=0.0.0.0

import { fail } from "./fail.ts";
import { onError, toStdHandler } from "./handler.ts";
import { signal } from "./interrupt_signal.ts";
import { getHandler } from "./server.ts";

if (typeof Symbol.dispose !== "symbol") {
  const dispose = Object.getOwnPropertySymbols(Deno.FsFile.prototype)
    .find((symbol) => symbol.description === "Symbol.dispose") ??
    fail(new TypeError("Cannot find Symbol.dispose"));
  Object.defineProperty(Symbol, "dispose", { value: dispose });
}
using kv = await Deno.openKv();
const server = Deno.serve({ handler: toStdHandler(getHandler(kv)), onError });
const abort = () => server.shutdown();
signal.addEventListener("abort", abort, { once: true });
try {
  await server.finished;
} finally {
  signal.removeEventListener("abort", abort);
}
