#!/usr/bin/env -S deno run --no-prompt --allow-read --allow-write --allow-net=registry.npmjs.org --allow-env --allow-sys=uid

import process from "node:process";
import { Arborist, type Node } from "../deps/arborist.ts";
import type { ImportMap, Scopes, SpecifierMap } from "../deps/importmap.ts";

process.on("log", (level: string, ...args: unknown[]) => {
  console.error(`[${level}]`, ...args);
});
const pin = "v131";
const dev = false;

function mapNode(node: Node, scopes: Scopes): SpecifierMap {
  const imports: SpecifierMap = {};
  for (const { to } of node.edgesOut.values()) {
    const { name, version } = to;
    const base = `https://esm.sh/${pin}/*${name}@${version}`;
    const query = `${dev ? "dev&" : ""}target=esnext`;
    imports[`${name}`] = `${base}?${query}`;
    imports[`${name}/`] = `${base}&${query}/`;
    const scope = `https://esm.sh/${pin}/${name}@${version}/`;
    scopes[scope] ??= mapNode(to, scopes);
  }
  return imports;
}

function normalizeSpecifierMap(obj: SpecifierMap | undefined): typeof obj {
  const entries: [string, string][] = [];
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === "string") {
      entries.push([key, value]);
    }
  }
  return entries.length === 0 ? undefined : Object.fromEntries(
    entries.sort(([a], [b]) => a > b ? 1 : a < b ? -1 : 0),
  );
}

function normalizeScopes(obj: Scopes | undefined): Scopes | undefined {
  const entries: [string, SpecifierMap][] = [];
  for (const key in obj) {
    const value = normalizeSpecifierMap(obj[key]);
    if (typeof value === "object") {
      entries.push([key, value]);
    }
  }
  return entries.length === 0 ? undefined : Object.fromEntries(
    entries.sort(([a], [b]) => a > b ? 1 : a < b ? -1 : 0),
  );
}

Deno.chdir(new URL("..", import.meta.url));
const arb = new Arborist({
  path: "static",
  legacyPeerDeps: true,
  update: true,
});
const idealTree = await arb.buildIdealTree();
const scopes: Scopes = {};
const imports = mapNode(idealTree.root, scopes);
const importMap: ImportMap = {
  imports: normalizeSpecifierMap(imports),
  scopes: normalizeScopes(scopes),
};
await Deno.writeTextFile(
  "static/import_map.json",
  JSON.stringify(importMap, undefined, 2) + "\n",
);
