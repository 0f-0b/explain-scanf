import { clsx } from "../deps/clsx.ts";
import React from "../deps/react.ts";

export interface ErrorMessageProps
  extends Omit<React.ComponentPropsWithoutRef<"span">, "children"> {
  children: unknown;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  className,
  children,
  ...props
}) => (
  <span className={clsx("error", className)} {...props}>
    {children instanceof Error ? children.message : String(children)}
  </span>
);
