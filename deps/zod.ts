import type {
  ZodType as ZodType_,
  ZodTypeDef,
} from "https://deno.land/x/zod@v3.24.1/mod.ts";

export * from "https://deno.land/x/zod@v3.24.1/mod.ts";
export type ZodType<T = unknown> = ZodType_<T, ZodTypeDef, unknown>;
