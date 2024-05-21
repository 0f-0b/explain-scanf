#!/usr/bin/env -S deno serve --unstable-kv --allow-read=dist,index.html,robots.txt

import { toFetch } from "./handler.ts";
import { getHandler } from "./server.ts";

const kv = await Deno.openKv();
export default { fetch: toFetch(getHandler(kv)) };
