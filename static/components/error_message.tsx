import React from "../deps/react.ts";
import { mergeClass } from "../util.ts";

export interface ErrorMessageProps
  extends Omit<React.ComponentPropsWithoutRef<"span">, "children"> {
  children: unknown;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  className,
  children,
  ...props
}) => (
  <span className={mergeClass("error", className)} {...props}>
    {children instanceof Error ? children.message : String(children)}
  </span>
);
