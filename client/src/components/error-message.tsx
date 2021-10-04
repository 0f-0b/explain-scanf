import type { ComponentPropsWithoutRef } from "react";
import { mergeClass } from "../util";
import classes from "./error-message.module.css";

export default function ErrorMessage({ className, children, ...props }: ComponentPropsWithoutRef<"span">): JSX.Element {
  return <span className={mergeClass(classes.error, className)} {...props}>{children}</span>;
}
