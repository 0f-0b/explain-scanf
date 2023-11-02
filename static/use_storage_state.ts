import { React, useCallback, useEffect } from "./deps/react.ts";

import { useDefaultedState } from "./use_defaulted_state.ts";
import { useFallibleEffect } from "./use_fallible_effect.ts";

function useStorageListener<S>(
  storageProvider: () => Storage,
  key: string,
  setState: React.Dispatch<React.SetStateAction<S>>,
): undefined {
  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === storageProvider()) {
        const json = event.newValue;
        if (json !== null) {
          setState(JSON.parse(json) as S);
        }
      }
    };
    addEventListener("storage", listener);
    return () => removeEventListener("storage", listener);
  }, [storageProvider, key]);
}

export function useStorageState<S>(
  storageProvider: () => Storage,
  key: string,
  defaultState: S | (() => S),
): [
  state: S,
  setState: React.Dispatch<React.SetStateAction<S>>,
  writeError: { error: unknown } | undefined,
] {
  const getItem = useCallback((): S => {
    const value = storageProvider().getItem(key);
    if (value === null) {
      throw new TypeError("Item does not exist");
    }
    return JSON.parse(value) as S;
  }, [storageProvider, key]);
  const setItem = useCallback((value: S): undefined => {
    storageProvider().setItem(key, JSON.stringify(value));
  }, [storageProvider, key]);
  const [state, setState] = useDefaultedState<S>(getItem, defaultState);
  useStorageListener(storageProvider, key, setState);
  const writeError = useFallibleEffect(() => setItem(state), [setItem, state]);
  return [state, setState, writeError];
}
