#!/usr/bin/env -S deno run --unstable-kv --allow-read --allow-write --allow-net --allow-env=DENO_KV_ACCESS_TOKEN

using kv = await Deno.openKv(Deno.args[0]);
const iter = kv.list({ prefix: [] });
for await (const entry of iter) {
  console.dir(entry, { depth: Infinity, iterableLimit: Infinity });
}
