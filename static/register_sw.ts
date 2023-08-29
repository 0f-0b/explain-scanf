(async () => {
  try {
    await navigator.serviceWorker.register("/sw.js", { type: "module" });
  } catch (e) {
    console.warn("Service worker registration failed:", e);
  }
})();
