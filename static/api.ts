import { timeout } from "./timeout.ts";

export interface Code {
  format: string;
  input: string;
}

async function validate(res: Response): Promise<unknown> {
  const obj = await res.json();
  if (!res.ok) {
    const { error } = obj as { error: string };
    throw new Error(error);
  }
  return obj;
}

export async function getCode(id: string): Promise<Code> {
  const res = await fetch(`/api/code/${id!}`, {
    signal: timeout(30000),
  });
  const { code } = await validate(res) as { code: Code };
  return code;
}

export async function putCode(code: Code): Promise<string> {
  const res = await fetch("/api/code", {
    headers: [
      ["content-type", "application/json"],
    ],
    body: JSON.stringify(code),
    method: "POST",
    signal: timeout(30000),
  });
  const { id } = await validate(res) as { id: string };
  return id;
}
