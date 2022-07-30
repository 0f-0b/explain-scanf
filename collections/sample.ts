import { toLength } from "./to_length.ts";

export function sample<T>(arr: ArrayLike<T>): T | undefined {
  return arr[Math.floor(Math.random() * toLength(arr.length))];
}
