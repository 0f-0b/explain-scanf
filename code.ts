import { gql, queryDatabase } from "./db.ts";
import { randomString } from "./util.ts";

export interface Code {
  format: string;
  input: string;
}

export async function getCode(id: string): Promise<Code | null> {
  if (!/^[a-z0-9]{8}$/.test(id)) {
    return null;
  }
  try {
    const { code: { format, input } } = await queryDatabase<{ id: string }, {
      code: {
        format: string;
        input: string;
      };
    }>(
      gql`
        query($id: String!) {
          code(id: $id) {
            format
            input
          }
        }
      `,
      { id },
    );
    return { format, input };
  } catch {
    return null;
  }
}

export async function putCode({ format, input }: Code): Promise<string> {
  for (;;) {
    try {
      const { createCode: { id } } = await queryDatabase<
        { id: string; format: string; input: string },
        {
          createCode: {
            id: string;
          };
        }
      >(
        gql`
          mutation($id: String!, $format: String!, $input: String!) {
            createCode(data: { id: $id, format: $format, input: $input }) {
              id
            }
          }
        `,
        {
          id: randomString(8, "abcdefghijklmnopqrstuvwxyz0123456789"),
          format,
          input,
        },
      );
      return id;
    } catch (e: unknown) {
      if ((e as { code: string })?.code !== "instance not unique") {
        throw e;
      }
    }
  }
}
