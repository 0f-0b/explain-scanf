/* @jsxImportSource react */

import { ShareIcon } from "@primer/octicons-react";
import { type React, useEffect, useState } from "react";

import { type Code, putCode } from "../api.ts";
import { ErrorMessage } from "./error_message.tsx";

export interface ShareButtonProps {
  code: Code;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ code }) => {
  const [shared, setShared] = useState<Code | undefined>();
  const [result, setResult] = useState<
    | { type: "success"; id: string }
    | { type: "error"; reason: unknown }
    | undefined
  >();
  useEffect(() => {
    if (!shared) {
      return;
    }
    setResult(undefined);
    (async () => {
      try {
        const id = await putCode(shared);
        setResult({ type: "success", id });
      } catch (e) {
        setShared(undefined);
        setResult({ type: "error", reason: e });
      }
    })();
  }, [shared]);
  return (
    <>
      <button
        className="share-button"
        onClick={() => setShared(code)}
      >
        <ShareIcon aria-label="Share" />
      </button>{" "}
      {result
        ? (() => {
          switch (result.type) {
            case "success": {
              const url = new URL(`/c/${result.id}`, location.href).toString();
              return (
                <input
                  className="share-url"
                  value={url}
                  size={url.length}
                  readOnly
                  onFocus={(event) => event.target.select()}
                />
              );
            }
            case "error":
              return <ErrorMessage>{result.reason}</ErrorMessage>;
          }
        })()
        : shared
        ? <span>…</span>
        : null}
    </>
  );
};
