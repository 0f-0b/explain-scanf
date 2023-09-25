const controller = new AbortController();
Deno.addSignalListener("SIGINT", function abort() {
  queueMicrotask(() => {
    Deno.addSignalListener("SIGINT", () => Deno.exit(0x82));
    Deno.removeSignalListener("SIGINT", abort);
  });
  controller.abort(new DOMException("Interrupted", "AbortError"));
});
export const signal = controller.signal;
