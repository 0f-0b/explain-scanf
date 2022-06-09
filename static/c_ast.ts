export const basicTypes = Object.freeze(
  [
    "void",
    "char",
    "short",
    "int",
    "long",
    "float",
    "double",
    "signed",
    "unsigned",
  ] as const,
);
export const typedefs = Object.freeze(
  [
    "wchar_t",
    "intmax_t",
    "uintmax_t",
    "size_t",
    "ptrdiff_t",
  ] as const,
);
export type BasicType = typeof basicTypes[number];
export type TypedefName = typeof typedefs[number];
export type TypeSpecifier = BasicType | TypedefName;
export type DeclarationSpecifier = TypeSpecifier | "typedef";

export interface Declaration {
  specifiers: DeclarationSpecifier[];
  declarators: InitDeclarator[];
}

export interface Declarator {
  type: Layer[];
  name: string;
}

export interface InitDeclarator {
  declarator: Declarator;
  initializer?: Expression;
}

export interface PointerLayer {
  type: "pointer";
}

export interface ArrayLayer {
  type: "array";
  size: number;
}

export type Layer =
  | PointerLayer
  | ArrayLayer;
export type Expression =
  | Constant
  | StringLiteral
  | FunctionCallExpression;
export type Constant =
  | IntegerConstant
  | FloatingConstant
  | CharacterConstant;

export interface IntegerConstant {
  type: "integer_constant";
  value: bigint;
}

export interface FloatingConstant {
  type: "floating_constant";
  value: { sign: 1 | -1; magnitude: number; payload?: string };
}

export interface CharacterConstant {
  type: "character_constant";
  prefix: string;
  value: string;
}

export interface StringLiteral {
  type: "string_literal";
  prefix: string;
  value: string;
}

export interface FunctionCallExpression {
  type: "function_call";
  name: string;
  args: Expression[];
}
