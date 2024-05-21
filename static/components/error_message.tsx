/* @jsxImportSource react */

import { clsx } from "clsx";
import type { React } from "react";

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
