import type {
  ZodType as ZodTypeBase,
  ZodTypeDef,
} from "https://deno.land/x/zod@v3.20.2/mod.ts";

export * from "https://deno.land/x/zod@v3.20.2/mod.ts";
export type ZodType<T> = ZodTypeBase<T, ZodTypeDef, unknown>;
