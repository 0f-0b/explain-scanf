import type { MatchingProps, RouteProps } from "./deps/@reach/router.ts";
import React, { useEffect, useState } from "./deps/react.ts";
import { ErrorMessage } from "./components/error_message.tsx";
import type { IndexLocationState } from "./index.tsx";
import { timeout } from "./timeout.ts";

export interface CodeProps extends RouteProps {
  id: string;
}

export const Code: React.FC<CodeProps> = ({ navigate, id }) => {
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    setError(undefined);
    (async () => {
      try {
        const res = await fetch(`/api/code/${id}`, {
          signal: timeout(30000),
        });
        const obj = await res.json() as
          | { format: string; input: string }
          | { error: string };
        if ("error" in obj) {
          throw new Error(obj.error);
        }
        const { format, input } = obj;
        await navigate<IndexLocationState>("/", {
          state: {
            value: { format, input },
          },
          replace: true,
        });
      } catch (e: unknown) {
        setError(e);
      }
    })();
  }, [id]);
  return error !== undefined
    ? <ErrorMessage>{error}</ErrorMessage>
    : <>Redirecting…</>;
};

export default Code as React.FC<MatchingProps>;
