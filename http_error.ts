import { type ErrorStatus, STATUS_CODE } from "@std/http/status";
import type { ConditionalKeys } from "type-fest/conditional-keys";

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
