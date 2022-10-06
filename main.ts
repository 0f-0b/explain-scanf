#!/usr/bin/env -S deno run -A

import { serve } from "./deps/std/http/server.ts";

import { onError, toStdHandler } from "./handler.ts";
import { handler } from "./server.ts";

await serve(toStdHandler(handler), { onError });
