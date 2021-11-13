import {
  string as _string,
  StructError,
} from "https://esm.sh/superstruct@0.15.3";

Object.defineProperty(StructError, "name", {
  value: "StructError",
  configurable: true,
});
export const string = _string();

export { StructError };
export { object } from "https://esm.sh/superstruct@0.15.3";
export type { Struct } from "https://esm.sh/superstruct@0.15.3";
