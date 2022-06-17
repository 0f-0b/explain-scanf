// deno-lint-ignore-file no-control-regex
const commonEscapes: [string, string][] = [
  ["\x00", "\\0"],
  ["\x01", "\\x01"],
  ["\x02", "\\x02"],
  ["\x03", "\\x03"],
  ["\x04", "\\x04"],
  ["\x05", "\\x05"],
  ["\x06", "\\x06"],
  ["\x07", "\\a"],
  ["\b", "\\b"],
  ["\t", "\\t"],
  ["\n", "\\n"],
  ["\v", "\\v"],
  ["\f", "\\f"],
  ["\r", "\\r"],
  ["\x0e", "\\x0e"],
  ["\x0f", "\\x0f"],
  ["\x10", "\\x10"],
  ["\x11", "\\x11"],
  ["\x12", "\\x12"],
  ["\x13", "\\x13"],
  ["\x14", "\\x14"],
  ["\x15", "\\x15"],
  ["\x16", "\\x16"],
  ["\x17", "\\x17"],
  ["\x18", "\\x18"],
  ["\x19", "\\x19"],
  ["\x1a", "\\x1a"],
  ["\x1b", "\\x1b"],
  ["\x1c", "\\x1c"],
  ["\x1d", "\\x1d"],
  ["\x1e", "\\x1e"],
  ["\x1f", "\\x1f"],
  ["\\", "\\\\"],
];

export const charEscapeRE = /[\0-\x1f\\']/g;
export const charEscapes = new Map([
  ...commonEscapes,
  ["'", "\\'"],
]);

export function escapeChar(s: string): string {
  return `'${s.replace(charEscapeRE, (c) => charEscapes.get(c) ?? c)}'`;
}

export const stringEscapeRE = /[\0-\x1f\\"]/g;
export const stringEscapes = new Map([
  ...commonEscapes,
  ['"', '\\"'],
]);

export function escapeString(s: string): string {
  return `"${s.replace(stringEscapeRE, (c) => stringEscapes.get(c) ?? c)}"`;
}
