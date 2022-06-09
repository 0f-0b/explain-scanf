export * from "https://esm.sh/@reach/router@1.3.4?deps=react@18.1.0&target=es2020&pin=v86";

export interface MatchingProps {
  path?: string;
  default?: boolean;
}

export interface WindowLocation<S = unknown> {
  pathname: string;
  search: string;
  hash: string;
  href: string;
  origin: string;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  state: S | null;
  key?: string;
}

export interface NavigateOptions<S> {
  state?: S;
  replace?: boolean;
}

export interface NavigateFn {
  <S>(to: string, options?: NavigateOptions<S>): Promise<undefined>;
  (to: number): Promise<undefined>;
}

export interface RouteProps<S = unknown> {
  uri: string;
  location: WindowLocation<S>;
  navigate: NavigateFn;
}
