import { requireEnv } from "./util.ts";

const token = requireEnv("FAUNA_SECRET");

interface DatabaseError {
  message: string;
  extensions: {
    code: string;
  };
}

export async function queryDatabase<T, R = unknown>(query: string, variables: T): Promise<R> {
  const res = await fetch("https://graphql.fauna.com/graphql", {
    headers: {
      "authorization": `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    method: "POST"
  });
  const obj = await res.json() as { data: R; } | { errors: DatabaseError[]; };
  if ("errors" in obj)
    throw (error => Object.assign(new Error(error.message), { code: error.extensions.code }))(obj.errors[0]);
  return obj.data;
}

export function gql(template: TemplateStringsArray, ...substitutions: unknown[]): string {
  return String.raw(template, ...substitutions).replace(/\s+/g, " ").trim();
}
