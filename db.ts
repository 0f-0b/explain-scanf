import { dedent } from "./deps/string_dedent.ts";
import { requireEnv } from "./env.ts";

export function gql<T>(
  template: { readonly raw: ArrayLike<string> },
): <R>(variables: T) => Promise<R> {
  const query = dedent(String.raw(template));
  return async <R>(variables: T) => {
    const token = requireEnv("FAUNA_SECRET");
    const res = await fetch("https://graphql.fauna.com/graphql", {
      headers: [
        ["authorization", `Bearer ${token}`],
        ["content-type", "application/json"],
      ],
      body: JSON.stringify({ query, variables }),
      method: "POST",
    });
    const obj = await res.json() as
      | { data: R }
      | { errors: { message: string; extensions?: { code: string } }[] };
    if ("errors" in obj) {
      const [error] = obj.errors;
      throw new DBError(error.message, error.extensions?.code);
    }
    return obj.data;
  };
}

export class DBError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "DBError";
    this.code = code;
    Error.captureStackTrace?.(this, DBError);
  }
}
