#!/usr/bin/env -S deno run --unstable

const kv = await Deno.openKv();
try {
  const iter = kv.list({ prefix: [] });
  for await (const entry of iter) {
    console.dir(entry, { depth: Infinity, iterableLimit: Infinity });
  }
} finally {
  kv.close();
}
