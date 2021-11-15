import React from "../deps/react.ts";
import { mergeClass } from "../util.ts";

export interface ErrorMessageProps
  extends Omit<React.ComponentPropsWithoutRef<"span">, "children"> {
  children: unknown;
}

export default function ErrorMessage(
  { className, children: error, ...props }: ErrorMessageProps,
): JSX.Element {
  return (
    <span className={mergeClass("error", className)} {...props}>
      {error instanceof Error ? error.message : String(error)}
    </span>
  );
}
