import { connect } from "./deps.ts";
import { requireEnv } from "./env.ts";
import { lua, redisUrlToOptions } from "./redis.ts";

const redisOptions = redisUrlToOptions(requireEnv("REDIS_URL"));

export async function getCode(id: string): Promise<{ format: string; input: string; } | undefined> {
  if (!/^[a-z0-9]{8}$/.test(id))
    return undefined;
  const redis = await connect(redisOptions);
  try {
    const code = await redis.eval(lua`
      local id = ARGV[1]
      local key = "code:" .. id
      local code = redis.call("hmget", key, "format", "input")
      if code[1] == false or code[2] == false then
        return false
      end
      redis.call("expire", key, 604800)
      return code
    `, [], [id]);
    if (code === undefined)
      return undefined;
    if (!Array.isArray(code) || typeof code[0] !== "string" || typeof code[1] !== "string")
      throw new TypeError("Invalid result from getCode script");
    const [format, input] = code;
    return { format, input };
  } finally {
    redis.close();
  }
}

export async function putCode(format: string, input: string): Promise<string> {
  const redis = await connect(redisOptions);
  try {
    const id = await redis.eval(lua`
      local function random_string(length, charset)
        local result = ""
        for i = 1, length do
          local x = math.random(1, #charset)
          result = result .. charset:sub(x, x)
        end
        return result
      end

      math.randomseed(tonumber(ARGV[3]))
      local id
      local key
      repeat
        id = random_string(8, "abcdefghijklmnopqrstuvwxyz0123456789")
        key = "code:" .. id
      until redis.call("exists", key) == 0
      redis.call("hset", key, "format", ARGV[1], "input", ARGV[2])
      redis.call("expire", key, 604800)
      return id
    `, [], [format, input, Math.trunc(Math.random() * 0x100000000).toString()]);
    if (typeof id !== "string")
      throw new TypeError("Invalid result from putCode script");
    return id;
  } finally {
    redis.close();
  }
}
