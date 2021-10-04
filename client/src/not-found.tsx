import type { RouteComponentProps } from "@reach/router";
import ErrorMessage from "./components/error-message";

export default function NotFound(_: RouteComponentProps): JSX.Element { // eslint-disable-line @typescript-eslint/no-unused-vars
  return <ErrorMessage>Not Found</ErrorMessage>;
}
