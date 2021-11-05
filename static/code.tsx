import { navigate } from "./deps/reach-router.ts";
import React, { useEffect, useState } from "./deps/react.ts";
import ErrorMessage from "./components/error-message.tsx";

export interface CodeParams {
  id: string;
}

// deno-lint-ignore no-explicit-any
export default function Code(props: any): JSX.Element {
  const { id }: CodeParams = props;
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    setError(undefined);
    (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const res = await fetch(`/api/code/${id}`, {
          signal: controller.signal,
        });
        const obj = await res.json() as
          | { format: string; input: string }
          | { error: string };
        if ("error" in obj) {
          throw new Error(obj.error);
        }
        const { format, input } = obj;
        await navigate("/", {
          state: {
            value: { format, input },
          },
          replace: true,
        });
      } catch (e: unknown) {
        setError(e);
      } finally {
        clearTimeout(timeout);
      }
    })();
  }, [id]);
  return error !== undefined
    ? <ErrorMessage>{String(error)}</ErrorMessage>
    : <>Redirecting…</>;
}
