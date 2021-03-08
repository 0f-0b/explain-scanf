export function requireEnv(key: string): string {
  const val = Deno.env.get(key);
  if (val === undefined)
    throw new Error(`'${key}' is not set`);
  return val;
}
