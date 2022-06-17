import React, { useEffect, useState } from "./deps/react.ts";
import { useNavigate, useParams } from "./deps/react_router_dom.ts";
import { ErrorMessage } from "./components/error_message.tsx";
import { timeout } from "./timeout.ts";

export const Code: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<"id">();
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    setError(undefined);
    (async () => {
      try {
        const res = await fetch(`/api/code/${id!}`, {
          signal: timeout(30000),
        });
        const obj = await res.json() as
          | { format: string; input: string }
          | { error: string };
        if ("error" in obj) {
          throw new Error(obj.error);
        }
        const { format, input } = obj;
        navigate("/", {
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

export default Code;
