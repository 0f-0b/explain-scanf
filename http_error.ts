import { type ErrorStatus, STATUS_CODE } from "./deps/std/http/status.ts";
import type { ConditionalKeys } from "./deps/type_fest/conditional_keys.d.ts";

export type HttpErrorName = ConditionalKeys<typeof STATUS_CODE, ErrorStatus>;

export interface HttpErrorOptions {
  headers?: HeadersInit;
}

export class HttpError extends Error {
  status: ErrorStatus;
  headers: Headers;

  constructor(
    message: string,
    name: HttpErrorName,
    options?: HttpErrorOptions,
  ) {
    const headers = new Headers(options?.headers);
    super(message);
    this.name = name;
    this.status = STATUS_CODE[name];
    this.headers = headers;
  }
}
