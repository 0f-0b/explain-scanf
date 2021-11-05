import React from "../deps/react.ts";

export function HlKeyword(
  { children }: React.PropsWithChildren<unknown>,
): JSX.Element {
  return <span className="hl-keyword">{children}</span>;
}

export function HlNumeric(
  { children }: React.PropsWithChildren<unknown>,
): JSX.Element {
  return <span className="hl-numeric">{children}</span>;
}

export function HlString(
  { children }: React.PropsWithChildren<unknown>,
): JSX.Element {
  return <span className="hl-string">{children}</span>;
}

export function HlOperator(
  { children }: React.PropsWithChildren<unknown>,
): JSX.Element {
  return <span className="hl-operator">{children}</span>;
}

export function HlBasicType(
  { children }: React.PropsWithChildren<unknown>,
): JSX.Element {
  return <span className="hl-basic-type">{children}</span>;
}

export function HlType(
  { children }: React.PropsWithChildren<unknown>,
): JSX.Element {
  return <span className="hl-type">{children}</span>;
}

export function HlFunction(
  { children }: React.PropsWithChildren<unknown>,
): JSX.Element {
  return <span className="hl-function">{children}</span>;
}

export function HlVariable(
  { children }: React.PropsWithChildren<unknown>,
): JSX.Element {
  return <span className="hl-variable">{children}</span>;
}

export function HlMacro(
  { children }: React.PropsWithChildren<unknown>,
): JSX.Element {
  return <span className="hl-macro">{children}</span>;
}

export function HlComment(
  { children }: React.PropsWithChildren<unknown>,
): JSX.Element {
  return <span className="hl-comment">{children}</span>;
}
