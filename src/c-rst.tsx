import * as React from "react";
import { Fragment, PropsWithChildren, ReactNode } from "react";
import { BasicType, basicTypes, Declaration, DeclarationSpecifier, Declarator, Expression, FloatingConstant, InitDeclarator, TypedefName, typedefs } from "./c-ast";
import { HlBasicType, HlFunction, HlKeyword, HlMacro, HlNumeric, HlOperator, HlString, HlType, HlVariable } from "./highlight";

function Parentheses({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <>({children})</>;
}

function PointerNode({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <><HlOperator>*</HlOperator>{children}</>;
}

function ArrayNode({ children, size }: PropsWithChildren<{ size: number; }>): JSX.Element {
  return <>{children}[<HlNumeric>{size}</HlNumeric>]</>;
}

export function DeclarationNode({ ast }: { ast: Declaration; }): JSX.Element {
  return <>{ast.specifiers.map((specifier, index, arr) => <Fragment key={index}><DeclarationSpecifierNode ast={specifier} />{index !== arr.length - 1 || ast.declarators.length ? " " : ""}</Fragment>)}{ast.declarators.map((declarator, index): ReactNode => index ? <Fragment key={index}>, <InitDeclaratorNode ast={declarator} /></Fragment> : <InitDeclaratorNode key={index} ast={declarator} />)};</>;
}

export function DeclarationSpecifierNode({ ast }: { ast: DeclarationSpecifier; }): JSX.Element {
  if (basicTypes.includes(ast as BasicType))
    return <HlBasicType>{ast}</HlBasicType>;
  if (typedefs.includes(ast as TypedefName))
    return <HlType>{ast}</HlType>;
  return <HlKeyword>{ast}</HlKeyword>;
}

export function InitDeclaratorNode({ ast }: { ast: InitDeclarator; }): JSX.Element {
  return ast.initializer ? <><DeclaratorNode ast={ast.declarator} /> <HlOperator>=</HlOperator> <ExpressionNode ast={ast.initializer} /></> : <DeclaratorNode ast={ast.declarator} />;
}

export function DeclaratorNode({ ast }: { ast: Declarator; }): JSX.Element {
  let result: ReactNode = <HlVariable>{ast.name}</HlVariable>;
  let wasPointer = false;
  for (const layer of ast.type) {
    if (layer.type === "pointer")
      wasPointer = true;
    else {
      if (wasPointer)
        result = <Parentheses>{result}</Parentheses>;
      wasPointer = false;
    }
    switch (layer.type) {
      case "pointer":
        result = <PointerNode>{result}</PointerNode>;
        break;
      case "array":
        result = <ArrayNode size={layer.size}>{result}</ArrayNode>;
        break;
    }
  }
  return <>{result}</>;
}

function escapeChar(s: string): string {
  return `'${s
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\t/g, "\\t")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\v/g, "\\v")
    .replace(/\f/g, "\\f")}'`;
}

function escapeString(s: string): string {
  return `"${s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "\\\"")
    .replace(/\t/g, "\\t")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\v/g, "\\v")
    .replace(/\f/g, "\\f")}"`;
}

function uint(value: bigint): JSX.Element {
  return <HlNumeric>{value.toString()}</HlNumeric>;
}

function ufloat(value: FloatingConstant["value"]): JSX.Element {
  if (isNaN(value.magnitude))
    return value.payload === undefined
      ? <HlMacro>NAN</HlMacro>
      : <ExpressionNode ast={{ type: "function_call", name: "nan", args: [{ type: "string_literal", prefix: "", value: value.payload }] }} />; // dirty hack
  if (value.magnitude === Infinity)
    return <HlMacro>INFINITY</HlMacro>;
  return <HlNumeric>{value.magnitude}</HlNumeric>;
}

export function ExpressionNode({ ast }: { ast: Expression; }): JSX.Element {
  switch (ast.type) {
    case "integer_constant":
      return ast.value < 0n ? <><HlOperator>-</HlOperator>{uint(-ast.value)}</> : uint(ast.value);
    case "floating_constant":
      return ast.value.sign < 0 ? <><HlOperator>-</HlOperator>{ufloat(ast.value)}</> : ufloat(ast.value);
    case "character_constant":
      return <HlString>{escapeChar(ast.value)}</HlString>;
    case "string_literal":
      return <>{ast.prefix}<HlString>{escapeString(ast.value)}</HlString></>;
    case "function_call":
      return <><HlFunction>{ast.name}</HlFunction>({ast.args.map((arg, index) => <Fragment key={index}>{index ? ", " : ""}<ExpressionNode ast={arg} /></Fragment>)})</>;
  }
}
