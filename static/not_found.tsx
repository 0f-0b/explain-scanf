import React from "./deps/react.ts";
import ErrorMessage from "./components/error_message.tsx";

// deno-lint-ignore no-explicit-any
export default function NotFound(_: any): JSX.Element {
  return <ErrorMessage>Not Found</ErrorMessage>;
}
