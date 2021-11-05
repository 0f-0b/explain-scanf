export const charEscapeRE = /[\\'\t\n\r\v\f]/g;
export const charEscapes = new Map([
  ["\\", "\\\\"],
  ["'", "\\'"],
  ["\t", "\\t"],
  ["\n", "\\n"],
  ["\r", "\\r"],
  ["\v", "\\v"],
  ["\f", "\\f"],
]);

export function escapeCharMatch(c: string): string {
  return charEscapes.get(c) ?? c;
}

export function escapeChar(s: string): string {
  return `'${s.replace(charEscapeRE, escapeCharMatch)}'`;
}

export const stringEscapeRE = /[\\"\t\n\r\v\f]/g;
export const stringEscapes = new Map([
  ["\\", "\\\\"],
  ['"', '\\"'],
  ["\t", "\\t"],
  ["\n", "\\n"],
  ["\r", "\\r"],
  ["\v", "\\v"],
  ["\f", "\\f"],
]);

export function escapeStringMatch(c: string): string {
  return stringEscapes.get(c) ?? c;
}

export function escapeString(s: string): string {
  return `"${s.replace(stringEscapeRE, escapeStringMatch)}"`;
}
