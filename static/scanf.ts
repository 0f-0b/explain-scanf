import { parseHexFloat } from "./deps/floating_point_hex_parser.ts";
import type {
  DeclarationSpecifier,
  Expression,
  FloatingConstant,
  Layer,
  TypeSpecifier,
} from "./c_ast.ts";
import { escapeChar, escapeString } from "./escape.ts";
import { findIndex } from "./util.ts";

const emptySet = new Set<string>();
const whitespace = new Set(" \t\n\r\v\f");
const whitespaceRE = /^[ \t\n\r\v\f]+/;
const nonAsciiRE = /[^\0-\x7f]/;
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
  scanset: Set<string>;
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
}

export interface ParseResult {
  value: Expression;
  length: number;
}

export interface ScanfResult {
  ret: number;
  length: number;
  matches: Range[];
  args: Argument[];
}

const matchingFailure: unique symbol = Symbol(
  "scanf/matchingFailure",
);
const inputFailure: unique symbol = Symbol(
  "scanf/inputFailure",
);
export const unimplemented: unique symbol = Symbol(
  "scanf/unimplemented",
);
export const undefinedBehavior: unique symbol = Symbol(
  "scanf/undefinedBehavior",
);

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
        scanset: spec === "s" || spec === "S" ? whitespace : emptySet,
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
        scanset: new Set(scanlistMatch[2]),
        negated: Boolean(scanlistMatch[1]),
      };
    }
  }
}

export function parseFormat(
  format: string,
): FormatDirective[] | typeof undefinedBehavior {
  const length = format.length;
  const result: FormatDirective[] = [];
  let nextPos = 0;
  for (let index = 0; index < length;) {
    const remaining = format.substring(index);
    const whitespaceMatch = whitespaceRE.exec(remaining);
    if (whitespaceMatch) {
      result.push({ type: "whitespace", implicit: false });
      index += whitespaceMatch[0].length;
      continue;
    }
    if (convValidateRE.test(remaining)) {
      const conversionMatch = convParseRE.exec(remaining);
      if (!conversionMatch) {
        throw new Error("Failed to match conversion");
      }
      const position = ((pos) => {
        switch (pos) {
          case "":
            if (nextPos === -1) {
              return undefinedBehavior;
            }
            return nextPos++;
          case "*":
            return -1;
          default:
            if (nextPos > 0) {
              return undefinedBehavior;
            }
            nextPos = -1;
            return parseInt(pos, 10) - 1;
        }
      })(conversionMatch[1]);
      if (position === undefinedBehavior) {
        return undefinedBehavior;
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
        result.push({ type: "whitespace", implicit: true });
      }
      const convLength = conversionMatch[0].length;
      result.push({
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
      return undefinedBehavior;
    }
    result.push({ type: "literal", ch });
  }
  return result;
}

function getArg(spec: ConvSpec): Argument | typeof unimplemented {
  switch (spec.type) {
    case "integer":
    case "float":
      return {
        specifiers: spec.dataType,
        type: [],
        ref: true,
      };
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
      return unimplemented;
    case "bytecount":
      return {
        specifiers: spec.dataType,
        type: [],
        ref: true,
      };
  }
}

function parse(
  spec: ConvSpec,
  arg: Argument | undefined,
  str: string,
  offset: number,
):
  | number
  | typeof matchingFailure
  | typeof inputFailure
  | typeof unimplemented {
  const failure = str ? matchingFailure : inputFailure;
  switch (spec.type) {
    case "integer": {
      const result = parseIntSeq(str, spec.base);
      if (!result) {
        return failure;
      }
      if (arg) {
        arg.initializer = { type: "integer_constant", value: result.value };
      }
      return result.length;
    }
    case "float": {
      const result = parseFloatSeq(str);
      if (!result) {
        return failure;
      }
      if (arg) {
        arg.initializer = { type: "floating_constant", value: result.value };
      }
      return result.length;
    }
    case "string": {
      const length = findIndex(
        str,
        (c) => spec.scanset.has(c) === spec.negated,
      );
      if (length === 0) {
        return failure;
      }
      const result = str.substring(0, length);
      const size = length + (spec.terminate ? 1 : 0);
      if (arg) {
        arg.type = spec.malloc
          ? [{ type: "pointer" }]
          : size === 1
          ? []
          : [{ type: "array", size }];
        arg.initializer = spec.malloc
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
        arg.ref = spec.malloc || size === 1;
      }
      return length;
    }
    case "pointer":
      return unimplemented;
    case "bytecount":
      if (arg) {
        arg.initializer = { type: "integer_constant", value: BigInt(offset) };
      }
      return 0;
  }
}

export function explain(directive: ConversionDirective): string {
  const { position, width, spec } = directive;
  let result: string;
  if (spec.type === "bytecount") {
    result = `Store the number of bytes read so far into the ${
      spec.dataType.join(" ")
    } `;
  } else {
    result = `Read ${
      width === 0
        ? "any number of bytes"
        : `at most ${width} ${width === 1 ? "byte" : "bytes"}`
    } `;
    switch (spec.type) {
      case "integer":
        result += `as an integer value${
          spec.base === 0 ? "" : ` in base ${spec.base}`
        } into the ${spec.dataType.join(" ")} `;
        break;
      case "float":
        result += `as a floating-point value into the ${
          spec.dataType.join(" ")
        } `;
        break;
      case "string":
        result += `${
          spec.scanset.size === 0 && spec.negated
            ? ""
            : `${spec.negated ? "not " : ""}equal to ${
              spec.scanset.size === 1
                ? escapeChar(spec.scanset[Symbol.iterator]().next().value)
                : `any of ${escapeString(Array.from(spec.scanset).join(""))}`
            } `
        }into ${spec.malloc ? "a newly-allocated" : "the"} ${
          spec.wide ? "wide " : ""
        }${spec.terminate ? "string" : "character array"}${
          spec.malloc ? ", the pointer to which is stored into the pointer" : ""
        } `;
        break;
      case "pointer":
        result += `as a pointer value into the pointer `;
        break;
    }
  }
  result += `pointed by argument ${position + 1}.`;
  return result;
}

export function sscanf(
  buf: string,
  format: FormatDirective[],
): ScanfResult | typeof unimplemented {
  if (nonAsciiRE.test(buf)) {
    return unimplemented;
  }
  const matches: Range[] = [];
  const args: Argument[] = [];
  const count = format.length;
  for (const directive of format) {
    if (directive.type === "conversion") {
      const { position, spec } = directive;
      if (position !== -1) {
        if (args[position]) {
          return unimplemented;
        }
        const arg = getArg(spec);
        if (arg === unimplemented) {
          return unimplemented;
        }
        args[position] = arg;
      }
    }
  }
  let ret = 0;
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
          if (ret === 0) {
            ret = -1;
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
        const length = parse(
          spec,
          args[position],
          width === 0 ? remaining : remaining.substring(0, width),
          offset,
        );
        if (length === inputFailure) {
          if (ret === 0) {
            ret = -1;
          }
          break scan;
        }
        if (length === matchingFailure) {
          break scan;
        }
        if (length === unimplemented) {
          return unimplemented;
        }
        if (position !== -1 && spec.type !== "bytecount") {
          ret++;
        }
        offset += length;
        matches.push({ start: lastOffset, end: offset });
        lastOffset = offset;
        break;
      }
    }
    i++;
  }
  return { ret, length: offset, matches, args };
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
