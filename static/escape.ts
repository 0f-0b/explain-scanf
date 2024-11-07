const specialEscapes = Object.freeze<Record<string, string>>({
  // @ts-expect-error Remove prototype
  __proto__: null,
  "\x07": "\\a",
  "\b": "\\b",
  "\t": "\\t",
  "\n": "\\n",
  "\v": "\\v",
  "\f": "\\f",
  "\r": "\\r",
  '"': '\\"',
  "'": "\\'",
  "\\": "\\\\",
});

function escape(str: string, re: RegExp): string {
  return str.replace(
    re,
    (c) =>
      specialEscapes[c] ?? `\\${c.charCodeAt(0).toString(8).padStart(3, "0")}`,
  );
}

export function escapeChar(str: string): string {
  // deno-lint-ignore no-control-regex
  return `'${escape(str, /[\0-\x1f'\\\x80-\xff]/g)}'`;
}

export function escapeString(str: string): string {
  // deno-lint-ignore no-control-regex
  return `"${escape(str, /[\0-\x1f"\\\x80-\xff]/g)}"`;
}
