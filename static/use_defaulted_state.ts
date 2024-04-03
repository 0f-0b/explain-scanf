import { type React, useEffect, useRef, useState } from "react";

function callIfCallable<T>(value: T | (() => T)): T {
  return typeof value === "function" ? (value as () => T)() : value;
}

export function useDefaultedState<S>(
  provider: () => S,
  defaultState: S | (() => S),
): [S, React.Dispatch<React.SetStateAction<S>>] {
  const [state, setState] = useState(() => {
    try {
      return provider();
    } catch {
      return callIfCallable(defaultState);
    }
  });
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    try {
      setState(provider());
    } catch {
      setState(callIfCallable(defaultState));
    }
  }, [provider]);
  return [state, setState];
}
