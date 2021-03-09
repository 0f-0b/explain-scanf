import { navigate, RouteComponentProps } from "@reach/router";
import * as React from "react";
import { useEffect, useState } from "react";
import { ErrorMessage } from "./components/error-message";

export interface CodeParams {
  id: string;
}

export function Code(props: RouteComponentProps<CodeParams>): JSX.Element {
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
        if (res.status !== 200)
          throw await res.text();
        const { format, input } = await res.json() as { format: string; input: string; };
        await navigate("/", {
          state: { format, input },
          replace: true
        });
      } catch (e) {
        setError(e);
      } finally {
        clearTimeout(timeout);
      }
    })();
  }, [id]);
  return error !== undefined ? <ErrorMessage>{String(error)}</ErrorMessage> : <>Redirecting…</>;
}
