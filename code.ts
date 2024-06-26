import { DAY } from "@std/datetime/constants";
import { z } from "zod";

import { randomString } from "./random.ts";

export const Code = z.strictObject({
  format: z.string(),
  input: z.string(),
});
export type Code = z.infer<typeof Code>;

export async function getCode(kv: Deno.Kv, id: string): Promise<Code | null> {
  if (!/^[a-z0-9]{8}$/.test(id)) {
    return null;
  }
  const entry = await kv.get(["code", id]) as Deno.KvEntryMaybe<Code>;
  if (entry.versionstamp !== null) {
    return entry.value;
  }
  return null;
}

export async function putCode(kv: Deno.Kv, code: Code): Promise<string> {
  for (;;) {
    const id = randomString(8, "abcdefghijklmnopqrstuvwxyz0123456789");
    const result = await kv.atomic()
      .check({ key: ["code", id], versionstamp: null })
      .set(["code", id], code, { expireIn: 90 * DAY })
      .commit();
    if (result.ok) {
      return id;
    }
  }
}
