export function findIndex<T>(it: Iterable<T>, pred: (value: T, index: number) => unknown): number {
  let count = 0;
  for (const elem of it) {
    if (pred(elem, count))
      return count;
    count++;
  }
  return count;
}

export function mapNotNullish<T, U>(it: Iterable<T>, transformer: (value: T, index: number) => U | undefined | null): U[] {
  const result: U[] = [];
  let count = 0;
  for (const elem of it) {
    const value = transformer(elem, count);
    if (value !== undefined && value !== null)
      result.push(value);
    count++;
  }
  return result;
}

export function mergeClass(newClass: string, propClass: string | undefined): string {
  return propClass ? `${newClass} ${propClass}` : newClass;
}
