import {
  any as makeAny,
  bigint as makeBigint,
  boolean as makeBoolean,
  coerce,
  date as makeDate,
  func as makeFunc,
  integer as makeInteger,
  never as makeNever,
  number as makeNumber,
  regexp as makeRegexp,
  string as makeString,
  type Struct,
  unknown as makeUnknown,
} from "https://esm.sh/superstruct@0.16.5?keep-names&pin=v96";

export * from "https://esm.sh/superstruct@0.16.5?keep-names&pin=v96";
export const any = makeAny();
export const bigint = makeBigint();
export const boolean = makeBoolean();
export const date = makeDate();
export const func = makeFunc();
export const integer = makeInteger();
export const never = makeNever();
export const number = makeNumber();
export const regexp = makeRegexp();
export const string = makeString();
export const unknown = makeUnknown();

export function json<T, S>(struct: Struct<T, S>): Struct<T, S> {
  return coerce(struct, string, (s) => JSON.parse(s));
}
