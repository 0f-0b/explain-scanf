import type { Redis, RedisConnectOptions } from "./deps.ts";
import { connect } from "./deps.ts";
import { requireEnv } from "./env.ts";

export function redisUrlToOptions(url: string): RedisConnectOptions {
  const { protocol, username, password, hostname, port, pathname } = new URL(url);
  if (!["redis:", "rediss:"].includes(protocol))
    throw new Error(`Unsupported protocol '${protocol}'`);
  const db = pathname.substring(1);
  if (!/^(?:|0|[1-9][0-9]*)$/.test(db))
    throw new SyntaxError("Invalid database number");
  return {
    hostname,
    port: port || undefined,
    tls: protocol === "rediss:",
    db: db ? parseInt(db, 10) : undefined,
    password: password || undefined,
    name: username || undefined
  };
}

let redis: Redis;

export async function getRedis(): Promise<Redis> {
  if (!redis)
    redis = await connect(redisUrlToOptions(requireEnv("REDIS_URL")));
  return redis;
}
