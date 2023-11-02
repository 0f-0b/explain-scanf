import { type ErrorStatus, Status } from "./deps/std/http/status.ts";

export interface HttpErrorOptions {
  headers?: HeadersInit;
}

export class HttpError extends Error {
  status: ErrorStatus;
  headers: Headers;

  constructor(
    status: ErrorStatus,
    message: string,
    options?: HttpErrorOptions,
  ) {
    const headers = new Headers(options?.headers);
    super(message);
    this.name = Status[status];
    this.status = status;
    this.headers = headers;
  }
}
