type JsonObject = { [key: string]: JsonValue | undefined };
type JsonArray = JsonValue[];
type JsonValue = JsonObject | JsonArray | string | number | boolean | null;

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function expandImports(obj: JsonValue): JsonValue {
  if (!isJsonObject(obj)) {
    return obj;
  }
  const imports = { __proto__: null, ...obj } as JsonObject;
  // deno-lint-ignore ban-types
  const result: JsonObject = { __proto__: null } as {};
  for (const key in imports) {
    const value = imports[key];
    result[key] = value;
    if (typeof value !== "string" || key.endsWith("/") || value.endsWith("/")) {
      continue;
    }
    const keyWithSlash = `${key}/`;
    if (keyWithSlash in imports) {
      continue;
    }
    const match = /^(jsr|npm):\/?/.exec(value);
    if (!match) {
      continue;
    }
    result[keyWithSlash] = `${match[1]}:/${value.substring(match[0].length)}/`;
  }
  return result;
}

export function expandImportMap(obj: JsonValue): JsonValue {
  if (!isJsonObject(obj)) {
    return obj;
  }
  let { imports, scopes } = { __proto__: null, ...obj } as JsonObject;
  if (isJsonObject(imports)) {
    imports = expandImports(imports);
  }
  if (isJsonObject(scopes)) {
    scopes = { __proto__: null, ...scopes } as JsonObject;
    for (const key in scopes) {
      const imports = scopes[key];
      if (isJsonObject(imports)) {
        scopes[key] = expandImports(imports);
      }
    }
  }
  return { imports, scopes };
}
