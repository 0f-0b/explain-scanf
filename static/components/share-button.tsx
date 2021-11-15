import { ShareIcon } from "../deps/octicons-react.ts";
import React, { useEffect, useState } from "../deps/react.ts";
import ErrorMessage from "./error-message.tsx";

export interface ShareButtonProps {
  format: string;
  input: string;
}

export default function ShareButton(
  { format, input }: ShareButtonProps,
): JSX.Element {
  const [shared, setShared] = useState<
    { format: string; input: string } | undefined
  >();
  const [result, setResult] = useState<
    | { type: "success"; id: string }
    | { type: "error"; reason: unknown }
    | undefined
  >();
  useEffect(() => {
    if (shared?.format === undefined || shared?.input === undefined) {
      return;
    }
    setResult(undefined);
    (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const res = await fetch("/api/code", {
          body: JSON.stringify({
            format: shared.format,
            input: shared.input,
          }),
          method: "POST",
          signal: controller.signal,
        });
        const obj = await res.json() as { id: string } | { error: string };
        if ("error" in obj) {
          throw new Error(obj.error);
        }
        setResult({ type: "success", id: obj.id });
      } catch (e: unknown) {
        setShared(undefined);
        setResult({ type: "error", reason: e });
      } finally {
        clearTimeout(timeout);
      }
    })();
  }, [shared?.format, shared?.input]);
  return (
    <>
      <button
        className="share-button"
        onClick={() => setShared({ format, input })}
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
}
