#!/usr/bin/env -S deno run --unstable --allow-read --allow-write --allow-net --allow-env=DENO_KV_ACCESS_TOKEN

const kv = await Deno.openKv(Deno.args[0]);
try {
  const iter = kv.list({ prefix: [] });
  for await (const entry of iter) {
    console.dir(entry, { depth: Infinity, iterableLimit: Infinity });
  }
} finally {
  kv.close();
}
