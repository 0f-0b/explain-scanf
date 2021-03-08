export function lua(template: TemplateStringsArray, ...substitutions: unknown[]): string {
  return String.raw(template, ...substitutions).replace(/\s+/g, " ").trim();
}
