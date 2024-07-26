import { sample } from "./collections/sample.ts";

export function randomString(length: number, charset: string): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += sample(charset);
  }
  return result;
}
