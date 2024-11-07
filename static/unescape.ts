import { unreachable } from "@std/assert/unreachable";

import { encodeUtf8ByteString } from "./encoding.ts";

const alphabeticEscapes = Object.freeze<Record<string, string>>({
  // @ts-expect-error Remove prototype
  __proto__: null,
  "a": "\x07",
  "b": "\b",
  "t": "\t",
  "n": "\n",
  "v": "\v",
  "f": "\f",
  "r": "\r",
});

export interface UnescapeResult {
  result: string;
  indices: number[];
}

function unescape(str: string, quote: string): UnescapeResult | null {
  let result = "";
  const indices: number[] = [];
  for (
    const re =
      /([^\\\n])|\\(["'?\\abtnvfr])|\\([0-7]{1,3})|\\x([0-9A-Fa-f]+)|\\u([0-9A-Fa-f]{4})|\\U([0-9A-Fa-f]{8})/uy;
    re.lastIndex < str.length;
  ) {
    const match = re.exec(str);
    if (!match) {
      return null;
    }
    const bytes = (() => {
      const { 1: ch, 2: simple, 3: octal, 4: hex, 5: u16, 6: u32 } = match;
      if (ch) {
        return ch === quote ? null : encodeUtf8ByteString(ch);
      }
      if (simple) {
        return alphabeticEscapes[simple] ?? simple;
      }
      if (octal) {
        const c = parseInt(octal, 8);
        return c <= 0xff ? String.fromCharCode(c) : null;
      }
      if (hex) {
        const c = parseInt(hex, 16);
        return c <= 0xff ? String.fromCharCode(c) : null;
      }
      if (u16) {
        const c = parseInt(u16, 16);
        return c < 0xd800 || c > 0xdfff
          ? encodeUtf8ByteString(String.fromCharCode(c))
          : null;
      }
      if (u32) {
        const c = parseInt(u32, 16);
        return c < 0xd800 || (c > 0xdfff && c <= 0x10ffff)
          ? encodeUtf8ByteString(String.fromCodePoint(c))
          : null;
      }
      unreachable();
    })();
    if (bytes === null) {
      return null;
    }
    result += bytes;
    for (let i = bytes.length; i--;) {
      indices.push(match.index);
    }
  }
  indices.push(str.length);
  return { result, indices };
}

export function unescapeChar(str: string): UnescapeResult | null {
  return unescape(str, "'");
}

export function unescapeString(str: string): UnescapeResult | null {
  return unescape(str, '"');
}
