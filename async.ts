export type Awaitable<T> = T | PromiseLike<T>;

export async function settled<T>(
  promise: T,
): Promise<PromiseSettledResult<Awaited<T>>> {
  try {
    return { status: "fulfilled", value: await promise };
  } catch (e) {
    return { status: "rejected", reason: e };
  }
}
