import type { MatchingProps, RouteProps } from "./deps/@reach/router.ts";
import React from "./deps/react.ts";
import { ErrorMessage } from "./components/error_message.tsx";

export const NotFound: React.FC<RouteProps> = () => (
  <ErrorMessage>Not Found</ErrorMessage>
);

export default NotFound as React.FC<MatchingProps>;
