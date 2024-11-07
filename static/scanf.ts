import { assert } from "@std/assert/assert";
import { parseHexFloat } from "floating-point-hex-parser";

import type {
  DeclarationSpecifier,
  Expression,
  FloatingConstant,
  Layer,
  TypeSpecifier,
} from "./c_ast.ts";
import { escapeChar } from "./escape.ts";

const whitespace = "\t\n\v\f\r ";
const whitespaceRE = /^[\t\n\v\f\r ]+/;
const convValidateRE =
  /^%(?:(?:\d+\$)?(?:|hh|h|l|ll|j|z|t)n|(?:\d+\$|\*?)(?:[1-9]\d*)?(?:(?:|hh|h|l|ll|j|z|t)[diouxX]|(?:|l|L)[aAeEfFgG]|m?(?:l?(?:[cs]|\[(?:\^|(?!\^))[^][^\]]*\])|[CS])|p))/;
const convParseRE =
  /^%(\d+\$|\*?)(\d*)(m?)(|hh|h|l|ll|j|z|t|L)([diouxXaAeEfFgGcsCSpn]|\[(?:\^|(?!\^))[^][^\]]*\])/;
const scanlistRE = /^\[(\^?)([^][^\]]*)\]$/;
const intBases = new Map<string, number>([
  ["o", 8],
  ["d", 10],
  ["u", 10],
  ["x", 16],
  ["X", 16],
]);
const intTypes = new Map<string, {
  signed: TypeSpecifier[];
  unsigned: TypeSpecifier[];
}>([
  ["hh", {
    signed: ["signed", "char"],
    unsigned: ["unsigned", "char"],
  }],
  ["h", {
    signed: ["short", "int"],
    unsigned: ["unsigned", "short", "int"],
  }],
  ["", {
    signed: ["int"],
    unsigned: ["unsigned", "int"],
  }],
  ["l", {
    signed: ["long", "int"],
    unsigned: ["unsigned", "long", "int"],
  }],
  ["ll", {
    signed: ["long", "long", "int"],
    unsigned: ["unsigned", "long", "long", "int"],
  }],
  ["j", {
    signed: ["intmax_t"],
    unsigned: ["uintmax_t"],
  }],
  ["z", {
    signed: ["signed", "size_t"],
    unsigned: ["size_t"],
  }],
  ["t", {
    signed: ["ptrdiff_t"],
    unsigned: ["unsigned", "ptrdiff_t"],
  }],
]);
const floatTypes = new Map<string, TypeSpecifier[]>([
  ["", ["float"]],
  ["l", ["double"]],
  ["L", ["long", "double"]],
]);

function intType(length: string, unsigned: boolean): TypeSpecifier[] {
  const type = intTypes.get(length);
  if (!type) {
    throw new Error(`Unknown int type '${length}'`);
  }
  return unsigned ? type.unsigned : type.signed;
}

function floatType(length: string): TypeSpecifier[] {
  const type = floatTypes.get(length);
  if (!type) {
    throw new Error(`Unknown float type '${length}'`);
  }
  return type;
}

export interface IntegerConvSpec {
  type: "integer";
  base: number;
  dataType: TypeSpecifier[];
}

export interface FloatConvSpec {
  type: "float";
  dataType: TypeSpecifier[];
}

export interface StringConvSpec {
  type: "string";
  malloc: boolean;
  terminate: boolean;
  wide: boolean;
  scanset: string;
  negated: boolean;
}

export interface PointerConvSpec {
  type: "pointer";
}

export interface ByteCountConvSpec {
  type: "bytecount";
  dataType: TypeSpecifier[];
}

export type ConvSpec =
  | IntegerConvSpec
  | FloatConvSpec
  | StringConvSpec
  | PointerConvSpec
  | ByteCountConvSpec;

export interface WhitespaceDirective {
  type: "whitespace";
  implicit: boolean;
}

export interface LiteralDirective {
  type: "literal";
  ch: string;
}

export interface ConversionDirective {
  type: "conversion";
  start: number;
  end: number;
  position: number;
  width: number;
  spec: ConvSpec;
}

export type FormatDirective =
  | WhitespaceDirective
  | LiteralDirective
  | ConversionDirective;

export interface Range {
  start: number;
  end: number;
}

export interface Conversion {
  index: Range;
  match: Range | null;
}

export interface Argument {
  specifiers: DeclarationSpecifier[];
  type: Layer[];
  initializer?: Expression;
  ref: boolean;
  comment?: string;
}

function getConvSpec(spec: string, length: string, malloc: boolean): ConvSpec {
  switch (spec) {
    case "d":
    case "i":
    case "o":
    case "u":
    case "x":
    case "X":
      return {
        type: "integer",
        base: intBases.get(spec) ?? 0,
        dataType: intType(length, spec !== "d" && spec !== "i"),
      };
    case "a":
    case "A":
    case "e":
    case "E":
    case "f":
    case "F":
    case "g":
    case "G":
      return {
        type: "float",
        dataType: floatType(length),
      };
    case "s":
    case "S":
    case "c":
    case "C":
      return {
        type: "string",
        malloc,
        terminate: spec === "s" || spec === "S",
        wide: length === "l" || spec === "S" || spec === "C",
        scanset: spec === "s" || spec === "S" ? whitespace : "",
        negated: true,
      };
    case "p":
      return {
        type: "pointer",
      };
    case "n":
      return {
        type: "bytecount",
        dataType: intType(length, false),
      };
    default: {
      const scanlistMatch = scanlistRE.exec(spec);
      if (!scanlistMatch) {
        throw new Error("Invalid conversion specifier");
      }
      return {
        type: "string",
        malloc,
        terminate: true,
        wide: length === "l",
        scanset: Array.from(new Set(scanlistMatch[2])).sort().join(""),
        negated: Boolean(scanlistMatch[1]),
      };
    }
  }
}

export function parseFormat(format: string):
  | { type: "success"; directives: FormatDirective[] }
  | { type: "undefined behavior" } {
  const length = format.length;
  const directives: FormatDirective[] = [];
  let nextPos = 0;
  for (let index = 0; index < length;) {
    const remaining = format.substring(index);
    const whitespaceMatch = whitespaceRE.exec(remaining);
    if (whitespaceMatch) {
      directives.push({ type: "whitespace", implicit: false });
      index += whitespaceMatch[0].length;
      continue;
    }
    if (convValidateRE.test(remaining)) {
      const conversionMatch = convParseRE.exec(remaining);
      assert(conversionMatch);
      const position = ((pos) => {
        switch (pos) {
          case "":
            if (nextPos === -1) {
              return null;
            }
            return nextPos++;
          case "*":
            return -1;
          default:
            if (nextPos > 0) {
              return null;
            }
            nextPos = -1;
            return parseInt(pos, 10) - 1;
        }
      })(conversionMatch[1]);
      if (position === null) {
        return { type: "undefined behavior" };
      }
      const spec = conversionMatch[5];
      const length = conversionMatch[4];
      const malloc = Boolean(conversionMatch[3]);
      const width = conversionMatch[2]
        ? parseInt(conversionMatch[2], 10)
        : spec === "c" || spec === "C"
        ? 1
        : 0;
      if (spec[0] !== "[" && spec !== "c" && spec !== "C" && spec !== "n") {
        directives.push({ type: "whitespace", implicit: true });
      }
      const convLength = conversionMatch[0].length;
      directives.push({
        type: "conversion",
        start: index,
        end: index + convLength,
        position,
        width,
        spec: getConvSpec(spec, length, malloc),
      });
      index += convLength;
      continue;
    }
    const ch = format[index++];
    if (ch === "%" && format[index++] !== "%") {
      return { type: "undefined behavior" };
    }
    directives.push({ type: "literal", ch });
  }
  return { type: "success", directives };
}

function getArg(spec: ConvSpec): Argument {
  switch (spec.type) {
    case "integer":
    case "float":
      return { specifiers: spec.dataType, type: [], ref: true };
    case "string":
      return {
        specifiers: spec.wide ? ["wchar_t"] : ["char"],
        type: spec.malloc
          ? [{ type: "pointer" }]
          : spec.terminate
          ? [{ type: "array", size: 1 }]
          : [],
        ref: !spec.terminate,
      };
    case "pointer":
      return { specifiers: ["void"], type: [{ type: "pointer" }], ref: true };
    case "bytecount":
      return { specifiers: spec.dataType, type: [], ref: true };
  }
}

function convert(spec: ConvSpec, str: string, offset: number, out?: Argument):
  | { type: "success"; length: number }
  | { type: "matching failure" }
  | { type: "input failure" }
  | { type: "unimplemented" } {
  switch (spec.type) {
    case "integer": {
      const result = parseIntSeq(str, spec.base);
      if (!result) {
        return str ? { type: "matching failure" } : { type: "input failure" };
      }
      if (out) {
        out.initializer = { type: "integer_constant", value: result.value };
      }
      return { type: "success", length: result.length };
    }
    case "float": {
      const result = parseFloatSeq(str);
      if (!result) {
        return str ? { type: "matching failure" } : { type: "input failure" };
      }
      if (out) {
        out.initializer = { type: "floating_constant", value: result.value };
      }
      return { type: "success", length: result.length };
    }
    case "string": {
      let length = 0;
      while (length < str.length) {
        if (spec.scanset.includes(str[length]) === spec.negated) {
          break;
        }
        length++;
      }
      if (length === 0) {
        return str ? { type: "matching failure" } : { type: "input failure" };
      }
      const result = str.substring(0, length);
      const size = length + (spec.terminate ? 1 : 0);
      if (out) {
        out.type = spec.malloc
          ? [{ type: "pointer" }]
          : size === 1
          ? []
          : [{ type: "array", size }];
        out.initializer = spec.malloc
          ? {
            type: "function_call",
            name: spec.wide ? "wcsdup" : "strdup",
            args: [{
              type: "string_literal",
              prefix: spec.wide ? "L" : "",
              value: result,
            }],
          }
          : {
            type: size === 1 ? "character_constant" : "string_literal",
            prefix: spec.wide ? "L" : "",
            value: result,
          };
        out.ref = spec.malloc || size === 1;
        if (spec.malloc && !spec.terminate) {
          out.comment = "but not null-terminated";
        }
      }
      return { type: "success", length };
    }
    case "pointer":
      return { type: "unimplemented" };
    case "bytecount":
      if (out) {
        out.initializer = { type: "integer_constant", value: BigInt(offset) };
      }
      return { type: "success", length: 0 };
  }
}

export function explain(directive: ConversionDirective): string {
  const { position, width, spec } = directive;
  let result: string;
  if (spec.type === "bytecount") {
    const dataType = spec.dataType.join(" ");
    result =
      `Store the number of bytes read so far into the ${dataType} variable`;
  } else {
    result = `Read ${
      width === 0
        ? "as many bytes as possible"
        : width === 1
        ? "one byte"
        : `at most ${width} bytes`
    }`;
    switch (spec.type) {
      case "integer": {
        const base = spec.base;
        const dataType = spec.dataType.join(" ");
        result += " that can be interpreted as an integer";
        if (base !== 0) {
          result += ` in base ${base}`;
        }
        result += `, and store the value into the ${dataType} variable`;
        break;
      }
      case "float": {
        const dataType = spec.dataType.join(" ");
        result +=
          ` that can be interpreted as a floating-point number, and store the value into the ${dataType} variable`;
        break;
      }
      case "string": {
        const scanset = spec.scanset;
        const negated = spec.negated;
        if (!(scanset.length === 0 && negated)) {
          const head = Array.from(scanset, escapeChar);
          const tail = head.pop()!;
          result += ` (${negated ? "not " : ""}equal to ${
            head.length === 0
              ? tail
              : head.length === 1
              ? `either ${head[0]} or ${tail}`
              : `any of ${head.join(", ")} or ${tail}`
          })`;
        }
        const dataType = `${spec.wide ? "wide " : ""}${
          spec.terminate ? "string" : "character array"
        }`;
        result += " into ";
        if (spec.malloc) {
          result +=
            `a newly-allocated ${dataType}, and store the pointer to which into the variable`;
        } else {
          result += `the ${dataType}`;
        }
        break;
      }
      case "pointer":
        result += " as a pointer value into the variable";
        break;
    }
  }
  result += ` pointed by argument ${position + 1}.`;
  return result;
}

export function sscanf(buf: string, format: readonly FormatDirective[]):
  | {
    type: "success";
    returnValue: number;
    length: number;
    matches: Range[];
    args: Argument[];
  }
  | { type: "unimplemented" } {
  const matches: Range[] = [];
  const args: Argument[] = [];
  const count = format.length;
  for (const directive of format) {
    if (directive.type === "conversion") {
      const { position, spec } = directive;
      if (position !== -1) {
        if (args[position]) {
          return { type: "unimplemented" };
        }
        args[position] = getArg(spec);
      }
    }
  }
  let returnValue = 0;
  let lastOffset = 0;
  let offset = 0;
  let i = 0;
  scan:
  while (i < count) {
    const directive = format[i];
    switch (directive.type) {
      case "whitespace": {
        const match = whitespaceRE.exec(buf.substring(offset));
        if (match) {
          offset += match[0].length;
        }
        if (!directive.implicit) {
          lastOffset = offset;
        }
        break;
      }
      case "literal": {
        if (offset >= buf.length) {
          if (returnValue === 0) {
            returnValue = -1;
          }
          break scan;
        }
        if (buf[offset] !== directive.ch) {
          break scan;
        }
        lastOffset = ++offset;
        break;
      }
      case "conversion": {
        const { position, width, spec } = directive;
        const remaining = buf.substring(offset);
        const convertResult = convert(
          spec,
          width === 0 ? remaining : remaining.substring(0, width),
          offset,
          args[position],
        );
        switch (convertResult.type) {
          case "success":
            if (position !== -1 && spec.type !== "bytecount") {
              returnValue++;
            }
            offset += convertResult.length;
            matches.push({ start: lastOffset, end: offset });
            lastOffset = offset;
            break;
          case "matching failure":
            break scan;
          case "input failure":
            if (returnValue === 0) {
              returnValue = -1;
            }
            break scan;
          case "unimplemented":
            return convertResult;
        }
      }
    }
    i++;
  }
  return { type: "success", returnValue, length: offset, matches, args };
}

interface IntSeq {
  value: bigint;
  length: number;
}

const intSeqREs = [
  /^([+-]?)([1-9]\d*|0[xX][0-9A-Fa-f]+|0[0-7]*)/,
  undefined,
  /^([+-]?)([01]+)/,
  /^([+-]?)([0-2]+)/,
  /^([+-]?)([0-3]+)/,
  /^([+-]?)([0-4]+)/,
  /^([+-]?)([0-5]+)/,
  /^([+-]?)([0-6]+)/,
  /^([+-]?)([0-7]+)/,
  /^([+-]?)([0-8]+)/,
  /^([+-]?)(\d+)/,
  /^([+-]?)([0-9aA]+)/,
  /^([+-]?)([0-9abAB]+)/,
  /^([+-]?)([0-9a-cA-C]+)/,
  /^([+-]?)([0-9a-dA-D]+)/,
  /^([+-]?)([0-9a-eA-E]+)/,
  /^([+-]?)(?:0[xX])?([0-9a-fA-F]+)/,
  /^([+-]?)([0-9a-gA-G]+)/,
  /^([+-]?)([0-9a-hA-H]+)/,
  /^([+-]?)([0-9a-iA-I]+)/,
  /^([+-]?)([0-9a-jA-J]+)/,
  /^([+-]?)([0-9a-kA-K]+)/,
  /^([+-]?)([0-9a-lA-L]+)/,
  /^([+-]?)([0-9a-mA-M]+)/,
  /^([+-]?)([0-9a-nA-N]+)/,
  /^([+-]?)([0-9a-oA-O]+)/,
  /^([+-]?)([0-9a-pA-P]+)/,
  /^([+-]?)([0-9a-qA-Q]+)/,
  /^([+-]?)([0-9a-rA-R]+)/,
  /^([+-]?)([0-9a-sA-S]+)/,
  /^([+-]?)([0-9a-tA-T]+)/,
  /^([+-]?)([0-9a-uA-U]+)/,
  /^([+-]?)([0-9a-vA-V]+)/,
  /^([+-]?)([0-9a-wA-W]+)/,
  /^([+-]?)([0-9a-xA-X]+)/,
  /^([+-]?)([0-9a-yA-Y]+)/,
  /^([+-]?)([0-9a-zA-Z]+)/,
];

function parseIntSeq(str: string, base: number): IntSeq | undefined {
  const re = intSeqREs[base];
  if (!re) {
    return undefined;
  }
  const match = re.exec(str);
  if (!match) {
    return undefined;
  }
  const length = match[0].length;
  const sign = match[1] === "-" ? -1n : 1n;
  let l = match[2].toLowerCase();
  if (base === 0) {
    if (l[0] !== "0") {
      base = 10;
    } else if (l[1] !== "x") {
      base = 8;
    } else {
      base = 16;
      l = l.substring(2);
    }
  }
  let value = 0n;
  for (const c of l) {
    value = value * BigInt(base) +
      BigInt("0123456789abcdefghijklmnopqrstuvwxyz".indexOf(c));
  }
  return { value: sign * value, length };
}

interface FloatSeq {
  value: FloatingConstant["value"];
  length: number;
}

const floatSeqRE =
  /^([+-]?)(0[xX](?:[0-9a-fA-F]+(?:\.[0-9a-fA-F]*|(?!\.))|\.[0-9a-fA-F]+)(?![0-9a-fA-F])(?:[pP][+-]?\d+|(?![pP]))|(?!0[xX])(?:\d+(?:\.\d*|(?!\.))|\.\d+)(?!\d)(?:[eE][+-]?\d+|(?![eE]))|[iI][nN][fF](?:[iI][nN][iI][tT][yY])?|[nN][aN][nN](?:\([0-9A-Za-z_]*\))?)/;

function parseFloatSeq(str: string): FloatSeq | undefined {
  const match = floatSeqRE.exec(str);
  if (!match) {
    return undefined;
  }
  const length = match[0].length;
  const sign = match[1] === "-" ? -1 : 1;
  const magnitude = match[2];
  const l = magnitude.toLowerCase();
  if (l.startsWith("nan")) {
    return {
      value: {
        sign,
        magnitude: NaN,
        payload: magnitude.length === 3 ? undefined : magnitude.slice(4, -1),
      },
      length,
    };
  }
  if (l.startsWith("inf")) {
    return { value: { sign, magnitude: Infinity }, length };
  }
  return {
    value: {
      sign,
      magnitude: l.startsWith("0x")
        ? parseHexFloat("0x0" + l.substring(2))
        : parseFloat(l),
    },
    length,
  };
}
