import {
  useStorageReducer,
  useStorageState,
} from "./deps/react_storage_hooks.ts";

export { useStorageReducer, useStorageState };

export type Storage = Parameters<typeof useStorageState>[0];

export function makeLazyStorage(factory: () => Storage): Storage {
  return {
    getItem(key) {
      return factory().getItem(key);
    },
    setItem(key, value) {
      return factory().setItem(key, value);
    },
    removeItem(key) {
      return factory().removeItem(key);
    },
  };
}

export const lazyLocalStorage = makeLazyStorage(() => localStorage);
export const lazySessionStorage = makeLazyStorage(() => sessionStorage);
