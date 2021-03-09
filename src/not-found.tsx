import { RouteComponentProps } from "@reach/router";
import * as React from "react";
import { ErrorMessage } from "./components/error-message";

export function NotFound(_props: RouteComponentProps): JSX.Element { // eslint-disable-line @typescript-eslint/no-unused-vars
  return <ErrorMessage>Not Found</ErrorMessage>;
}
