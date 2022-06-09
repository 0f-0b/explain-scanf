import React from "../deps/react.ts";
import type {
  Declaration,
  DeclarationSpecifier,
  Declarator,
  Expression,
  FloatingConstant,
  InitDeclarator,
} from "../c_ast.ts";
import { basicTypes, typedefs } from "../c_ast.ts";
import { escapeChar, escapeString } from "../escape.ts";
import {
  HlBasicType,
  HlFunction,
  HlKeyword,
  HlMacro,
  HlNumeric,
  HlOperator,
  HlString,
  HlType,
  HlVariable,
} from "./highlight.tsx";

const Parentheses: React.FC<React.PropsWithChildren> = ({ children }) => (
  <>({children})</>
);
const PointerNode: React.FC<React.PropsWithChildren> = ({ children }) => (
  <>
    <HlOperator>*</HlOperator>
    {children}
  </>
);
const ArrayNode: React.FC<React.PropsWithChildren<{ size: number }>> = ({
  children,
  size,
}) => (
  <>
    {children}[<HlNumeric>{size}</HlNumeric>]
  </>
);

function uint(value: bigint): JSX.Element {
  return <HlNumeric>{value.toString()}</HlNumeric>;
}

function ufloat(value: FloatingConstant["value"]): JSX.Element {
  if (isNaN(value.magnitude)) {
    return value.payload === undefined
      ? <HlMacro>NAN</HlMacro>
      : (
        <ExpressionNode
          ast={{
            type: "function_call",
            name: "nan",
            args: [{
              type: "string_literal",
              prefix: "",
              value: value.payload,
            }],
          }}
        />
      ); // dirty hack
  }
  if (value.magnitude === Infinity) {
    return <HlMacro>INFINITY</HlMacro>;
  }
  return <HlNumeric>{value.magnitude}</HlNumeric>;
}

type NC<T> = React.FC<{ ast: T }>;
export const DeclarationNode: NC<Declaration> = ({ ast }) => (
  <>
    {ast.specifiers.map((specifier, index, arr) => (
      <React.Fragment key={index}>
        <DeclarationSpecifierNode ast={specifier} />
        {index !== arr.length - 1 || ast.declarators.length ? " " : ""}
      </React.Fragment>
    ))}
    {ast.declarators.map((declarator, index) =>
      index
        ? (
          <React.Fragment key={index}>
            , <InitDeclaratorNode ast={declarator} />
          </React.Fragment>
        )
        : <InitDeclaratorNode key={index} ast={declarator} />
    )};
  </>
);
export const DeclarationSpecifierNode: NC<DeclarationSpecifier> = ({ ast }) =>
  (basicTypes as readonly DeclarationSpecifier[]).includes(ast)
    ? <HlBasicType>{ast}</HlBasicType>
    : (typedefs as readonly DeclarationSpecifier[]).includes(ast)
    ? <HlType>{ast}</HlType>
    : <HlKeyword>{ast}</HlKeyword>;
export const InitDeclaratorNode: NC<InitDeclarator> = ({ ast }) => (
  <>
    <DeclaratorNode ast={ast.declarator} />
    {ast.initializer && (
      <>
        {" "}
        <HlOperator>=</HlOperator> <ExpressionNode ast={ast.initializer} />
      </>
    )}
  </>
);
export const DeclaratorNode: NC<Declarator> = ({ ast }) => {
  let result = <HlVariable>{ast.name}</HlVariable>;
  let wasPointer = false;
  for (const layer of ast.type) {
    if (layer.type === "pointer") {
      wasPointer = true;
    } else {
      if (wasPointer) {
        result = <Parentheses>{result}</Parentheses>;
      }
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
  return result;
};
export const ExpressionNode: NC<Expression> = ({ ast }) => {
  switch (ast.type) {
    case "integer_constant":
      return ast.value < 0n
        ? (
          <>
            <HlOperator>-</HlOperator>
            {uint(-ast.value)}
          </>
        )
        : uint(ast.value);
    case "floating_constant":
      return ast.value.sign < 0
        ? (
          <>
            <HlOperator>-</HlOperator>
            {ufloat(ast.value)}
          </>
        )
        : ufloat(ast.value);
    case "character_constant":
      return <HlString>{escapeChar(ast.value)}</HlString>;
    case "string_literal":
      return (
        <>
          {ast.prefix}
          <HlString>{escapeString(ast.value)}</HlString>
        </>
      );
    case "function_call":
      return (
        <>
          <HlFunction>{ast.name}</HlFunction>({ast.args.map((arg, index) => (
            <React.Fragment key={index}>
              {index ? ", " : ""}
              <ExpressionNode ast={arg} />
            </React.Fragment>
          ))})
        </>
      );
  }
};
