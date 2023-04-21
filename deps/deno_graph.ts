import { init as instantiate } from "https://deno.land/x/deno_graph@0.47.1/mod.ts";
import { DenoDir } from "./deno_cache.ts";
import { dirname, toFileUrl } from "./std/path.ts";

export * from "https://deno.land/x/deno_graph@0.47.1/mod.ts";

async function cache(url: string): Promise<string> {
  const { deps } = new DenoDir();
  const path = deps.getCacheFilename(new URL(url));
  fetch: {
    try {
      const info = await Deno.lstat(path);
      if (info.isFile) {
        break fetch;
      }
    } catch (e) {
      if (!(e instanceof Deno.errors.NotFound)) {
        throw e;
      }
    }
    await Deno.mkdir(dirname(path), { recursive: true });
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const tempFile = await Deno.makeTempFile();
    try {
      await Deno.writeFile(tempFile, res.body ?? new Uint8Array());
      await Deno.rename(tempFile, path);
    } catch (e) {
      await Deno.remove(tempFile);
      throw e;
    }
  }
  return path;
}

const wasmUrl = "https://deno.land/x/deno_graph@0.47.1/deno_graph_wasm_bg.wasm";

export async function init(): Promise<undefined> {
  await instantiate({ url: toFileUrl(await cache(wasmUrl)) });
  return;
}
