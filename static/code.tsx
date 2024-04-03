// deno-lint-ignore verbatim-module-syntax
import { React, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getCode } from "./api.ts";
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
      } catch (e) {
        setError(e);
      }
    })();
  }, [id]);
  return error !== undefined
    ? <ErrorMessage>{error}</ErrorMessage>
    : <>Redirecting…</>;
};
export default Code;
