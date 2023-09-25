import { DAY } from "./deps/std/datetime/constants.ts";
import { z } from "./deps/zod.ts";

import { DBError, gql } from "./fauna.ts";
import { randomString } from "./random.ts";

export const Code = z.strictObject({
  format: z.string(),
  input: z.string(),
});
export type Code = z.infer<typeof Code>;

/** @deprecated */
const doGetCode = gql<{ id: string }>`
  query($id: String!) {
    code(id: $id) {
      format
      input
    }
  }
`<{
  code: {
    format: string;
    input: string;
  };
}>;

export async function getCode(kv: Deno.Kv, id: string): Promise<Code | null> {
  if (!/^[a-z0-9]{8}$/.test(id)) {
    return null;
  }
  const entry = await kv.get(["code", id]) as Deno.KvEntryMaybe<Code>;
  if (entry.versionstamp !== null) {
    return entry.value;
  }
  try {
    const { code } = await doGetCode({ id });
    return code;
  } catch (e) {
    if (e instanceof DBError && e.code === "instance not found") {
      return null;
    }
    throw e;
  }
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
