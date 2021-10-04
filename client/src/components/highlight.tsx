import type { PropsWithChildren } from "react";
import classes from "./highlight.module.css";

export function HlKeyword({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className={classes.hlKeyword}>{children}</span>;
}

export function HlNumeric({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className={classes.hlNumeric}>{children}</span>;
}

export function HlString({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className={classes.hlString}>{children}</span>;
}

export function HlOperator({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className={classes.hlOperator}>{children}</span>;
}

export function HlBasicType({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className={classes.hlBasicType}>{children}</span>;
}

export function HlType({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className={classes.hlType}>{children}</span>;
}

export function HlFunction({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className={classes.hlFunction}>{children}</span>;
}

export function HlVariable({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className={classes.hlVariable}>{children}</span>;
}

export function HlMacro({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className={classes.hlMacro}>{children}</span>;
}

export function HlComment({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className={classes.hlComment}>{children}</span>;
}
