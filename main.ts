#!/usr/bin/env -S deno serve --unstable-kv --allow-import=deno.land:443,jsr.io:443 --allow-read=dist,404.html,index.html,robots.txt

import { toFetch } from "./handler.ts";
import { getHandler } from "./server.ts";

const kv = await Deno.openKv();
export default {
  fetch: toFetch(getHandler(kv)),
} satisfies Deno.ServeDefaultExport;
