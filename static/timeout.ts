export function timeout(ms: number): AbortSignal {
  const controller = new AbortController();
  const error = new DOMException("A timeout has occurred.", "TimeoutError");
  setTimeout(() => controller.abort(error), ms);
  return controller.signal;
}
