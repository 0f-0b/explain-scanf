import { toLength } from "./to_length.ts";

const { floor, random } = Math;

export function sample<T>(arr: ArrayLike<T>): T | undefined {
  const length = toLength(arr.length);
  return length === 0 ? undefined : arr[floor(random() * length)];
}
