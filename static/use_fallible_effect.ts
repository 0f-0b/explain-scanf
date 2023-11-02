import { useEffect, useState } from "./deps/react.ts";

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
