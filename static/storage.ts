export const safeLocalStorage: Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
> = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignored
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignored
    }
  },
};
