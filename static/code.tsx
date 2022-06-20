import React, { useEffect, useState } from "./deps/react.ts";
import { useNavigate, useParams } from "./deps/react_router_dom.ts";
import { getCode } from "./code.ts";
import { ErrorMessage } from "./components/error_message.tsx";

export const Code: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<"id">();
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    setError(undefined);
    (async () => {
      try {
        const code = await getCode(id!);
        navigate("/", {
          state: { code },
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
