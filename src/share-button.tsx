import { ShareIcon } from "@primer/octicons-react";
import * as React from "react";
import { ComponentPropsWithoutRef, useEffect, useState } from "react";
import classes from "./share-button.module.css";
import { mergeClass } from "./util";

export interface ShareButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "onClick"> {
  format: string;
  input: string;
}

export function ShareButton({ format, input, className, ...props }: ShareButtonProps): JSX.Element {
  const [shared, setShared] = useState<{ format: string; input: string; } | undefined>();
  const [result, setResult] = useState<{ type: "success"; id: string; } | { type: "error"; reason: unknown; } | undefined>();
  useEffect(() => {
    if (shared?.format !== undefined && shared?.input !== undefined) {
      setResult(undefined);
      void (async () => {
        const controller = new AbortController;
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
          const res = await fetch("/api/code", {
            body: JSON.stringify({
              format: shared.format,
              input: shared.input
            }),
            method: "POST",
            signal: controller.signal
          });
          if (res.status !== 201)
            throw await res.text();
          setResult({ type: "success", id: await res.text() });
        } catch (e) {
          setShared(undefined);
          setResult({ type: "error", reason: e });
        } finally {
          clearTimeout(timeout);
        }
      })();
    }
  }, [shared?.format, shared?.input]);
  return <><button className={mergeClass(classes.shareButton, className)} onClick={() => setShared({ format, input })} {...props}><ShareIcon aria-label="Share" /></button> {result ? (() => {
    switch (result.type) {
      case "success": {
        const url = new URL(`/c/${result.id}`, location.href).toString();
        return <input className={classes.shareUrl} value={url} size={url.length} readOnly />;
      }
      case "error":
        return <span className={classes.error}>{String(result.reason)}</span>;
    }
  })() : shared ? <span>…</span> : null}</>;
}
