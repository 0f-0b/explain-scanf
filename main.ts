#!/usr/bin/env -S deno run --allow-read=. --allow-net=0.0.0.0,graphql.fauna.com --allow-env=FAUNA_SECRET

import { serve } from "./deps/std/http/server.ts";

import { onError, toStdHandler } from "./handler.ts";
import { handler } from "./server.ts";

await serve(toStdHandler(handler), { onError });
