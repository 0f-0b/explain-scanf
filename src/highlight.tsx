import * as React from "react";
import { PropsWithChildren } from "react";

export function HlKeyword({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className="hl-keyword">{children}</span>;
}

export function HlNumeric({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className="hl-numeric">{children}</span>;
}

export function HlString({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className="hl-string">{children}</span>;
}

export function HlOperator({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className="hl-operator">{children}</span>;
}

export function HlBasicType({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className="hl-basic-type">{children}</span>;
}

export function HlType({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className="hl-type">{children}</span>;
}

export function HlFunction({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className="hl-function">{children}</span>;
}

export function HlVariable({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className="hl-variable">{children}</span>;
}

export function HlMacro({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className="hl-macro">{children}</span>;
}

export function HlComment({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <span className="hl-comment">{children}</span>;
}
