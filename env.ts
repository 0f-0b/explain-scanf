import { fail } from "./fail.ts";

export function requireEnv(key: string): string {
  return Deno.env.get(key) ?? fail(new Error(`'${key}' is not set`));
}
