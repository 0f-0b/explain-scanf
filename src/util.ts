export function findIndex<A extends ArrayLike<T>, T = A[number]>(arr: A, pred: (value: T, index: number, arr: A) => unknown, thisArg?: unknown): number {
  const length = arr.length;
  for (let i = 0; i < length; i++)
    if (pred.call(thisArg, arr[i], i, arr))
      return i;
  return length;
}

export function filterMap<U, A extends ArrayLike<T>, T = A[number]>(arr: A, cb: (value: T, index: number, arr: A) => U | undefined, thisArg?: unknown): U[] {
  const result: U[] = [];
  const length = arr.length;
  for (let i = 0; i < length; i++) {
    const mapped = cb.call(thisArg, arr[i], i, arr);
    if (mapped !== undefined)
      result.push(mapped);
  }
  return result;
}

export function mergeClass(newClass: string, propClass: string | undefined): string {
  return propClass ? `${newClass} ${propClass}` : newClass;
}
