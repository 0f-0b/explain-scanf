import { requireEnv } from "./util.ts";

interface DatabaseError {
  message: string;
  extensions: {
    code: string;
  };
}

export async function queryDatabase<T, R = unknown>(
  query: string,
  variables: T,
): Promise<R> {
  const token = requireEnv("FAUNA_SECRET");
  const res = await fetch("https://graphql.fauna.com/graphql", {
    headers: {
      "authorization": `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    method: "POST",
  });
  const obj = await res.json() as { data: R } | { errors: DatabaseError[] };
  if ("errors" in obj) {
    const [firstError] = obj.errors;
    throw Object.assign(new Error(firstError.message), {
      code: firstError.extensions.code,
    });
  }
  return obj.data;
}

export function gql(
  template: TemplateStringsArray,
  ...substitutions: unknown[]
): string {
  return String.raw(template, ...substitutions)
    .replace(/(?:\s|\\n)+/g, " ")
    .trim();
}
