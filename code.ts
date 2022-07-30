import { object, string } from "./deps/superstruct.ts";

import { DBError, gql } from "./db.ts";
import { randomString } from "./random.ts";

export const Code = object({
  format: string,
  input: string,
});
export type Code = typeof Code["TYPE"];

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

export async function getCode(id: string): Promise<Code | null> {
  if (!/^[a-z0-9]{8}$/.test(id)) {
    return null;
  }
  try {
    const { code } = await doGetCode({ id });
    return code;
  } catch (e) {
    if (!(e instanceof DBError && e.code === "instance not found")) {
      throw e;
    }
    return null;
  }
}

const doPutCode = gql<{ id: string; format: string; input: string }>`
  mutation($id: String!, $format: String!, $input: String!) {
    createCode(data: { id: $id, format: $format, input: $input }) {
      id
    }
  }
`<{
  createCode: {
    id: string;
  };
}>;

export async function putCode(code: Code): Promise<string> {
  for (;;) {
    try {
      const id = randomString(8, "abcdefghijklmnopqrstuvwxyz0123456789");
      await doPutCode({ id, ...code });
      return id;
    } catch (e) {
      if (!(e instanceof DBError && e.code === "instance not unique")) {
        throw e;
      }
    }
  }
}
