declare global {
  interface AbortSignal {
    readonly reason?: unknown;
  }

  interface URLPatternInit {
    protocol?: string;
    username?: string;
    password?: string;
    hostname?: string;
    port?: string;
    pathname?: string;
    search?: string;
    hash?: string;
    baseURL?: string;
  }

  type URLPatternInput = string | URLPatternInit;

  interface URLPatternComponentResult {
    input: string;
    groups: Record<string, string>;
  }

  interface URLPatternResult {
    inputs: [URLPatternInit] | [URLPatternInit, string];
    protocol: URLPatternComponentResult;
    username: URLPatternComponentResult;
    password: URLPatternComponentResult;
    hostname: URLPatternComponentResult;
    port: URLPatternComponentResult;
    pathname: URLPatternComponentResult;
    search: URLPatternComponentResult;
    hash: URLPatternComponentResult;
  }

  class URLPattern {
    constructor(input: URLPatternInput, baseURL?: string);
    test(input: URLPatternInput, baseURL?: string): boolean;
    exec(input: URLPatternInput, baseURL?: string): URLPatternResult | null;

    readonly protocol: string;
    readonly username: string;
    readonly password: string;
    readonly hostname: string;
    readonly port: string;
    readonly pathname: string;
    readonly search: string;
    readonly hash: string;
  }
}

export {};
