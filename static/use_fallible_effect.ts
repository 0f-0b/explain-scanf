import { type React, useEffect, useState } from "react";

export function useFallibleEffect(
  effect: React.EffectCallback,
  deps: React.DependencyList,
): { error: unknown } | undefined {
  const [error, setError] = useState<{ error: unknown }>();
  useEffect(() => {
    try {
      effect();
      setError(undefined);
    } catch (e) {
      setError({ error: e });
    }
  }, deps);
  return error;
}
