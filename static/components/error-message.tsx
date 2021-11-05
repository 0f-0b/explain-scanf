import React from "../deps/react.ts";
import { mergeClass } from "../util.ts";

export default function ErrorMessage(
  { className, children, ...props }: React.ComponentPropsWithoutRef<"span">,
): JSX.Element {
  return (
    <span className={mergeClass("error", className)} {...props}>
      {children}
    </span>
  );
}
