import exports from "./main.ts";

Deno.serve((req) => exports.fetch(req));
