import { json } from "./deps/sift.ts";

export function notFound() {
  return json({ error: "not found" }, { status: 404 });
}

export function requireEnv(key: string): string {
  const val = Deno.env.get(key);
  if (val === undefined)
    throw new Error(`'${key}' is not set`);
  return val;
}

export function randomString(length: number, charset: string): string {
  return Array.from({ length }, () => charset[Math.trunc(Math.random() * charset.length)]).join("");
}
