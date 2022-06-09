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
`;

export async function getCode(id: string): Promise<Code | null> {
  if (!/^[a-z0-9]{8}$/.test(id)) {
    return null;
  }
  try {
    const { code: { format, input } } = await doGetCode({ id }) as {
      code: {
        format: string;
        input: string;
      };
    };
    return { format, input };
  } catch (e: unknown) {
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
`;

export async function putCode({ format, input }: Code): Promise<string> {
  for (;;) {
    try {
      const { createCode: { id } } = await doPutCode({
        id: randomString(8, "abcdefghijklmnopqrstuvwxyz0123456789"),
        format,
        input,
      }) as {
        createCode: {
          id: string;
        };
      };
      return id;
    } catch (e: unknown) {
      if (!(e instanceof DBError && e.code === "instance not unique")) {
        throw e;
      }
    }
  }
}
