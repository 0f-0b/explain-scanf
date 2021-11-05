import type { InterveneFunction } from "./serve-static.ts";

export function setHeader(key: string, value: string): InterveneFunction {
  return (_, res) => {
    res.headers.set(key, value);
    return res;
  };
}
