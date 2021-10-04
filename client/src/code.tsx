import type { RouteComponentProps } from "@reach/router";
import { useEffect, useState } from "react";
import { IndexLocationState } from ".";
import ErrorMessage from "./components/error-message";
import { navigate } from "./navigate";

export interface CodeParams {
  id: string;
}

export default function Code(props: RouteComponentProps<CodeParams>): JSX.Element {
  const { id } = props as CodeParams;
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    setError(undefined);
    void (async () => {
      const controller = new AbortController;
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const res = await fetch(`/api/code/${id}`, {
          signal: controller.signal
        });
        const obj = await res.json() as { format: string; input: string; } | { error: string; };
        if ("error" in obj)
          throw new Error(obj.error);
        const { format, input } = obj;
        await navigate<IndexLocationState>("/", {
          state: { format, input },
          replace: true
        });
      } catch (e: unknown) {
        setError(e);
      } finally {
        clearTimeout(timeout);
      }
    })();
  }, [id]);
  return error !== undefined ? <ErrorMessage>{String(error)}</ErrorMessage> : <>Redirecting…</>;
}
