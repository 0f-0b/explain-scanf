import { sample } from "./collections/sample.ts";

export function randomString(length: number, charset: string): string {
  return Array.from({ length }, () => sample(charset)).join("");
}
