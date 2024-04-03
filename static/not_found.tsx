// deno-lint-ignore verbatim-module-syntax
import { React } from "react";

import { ErrorMessage } from "./components/error_message.tsx";

export const NotFound: React.FC = () => (
  <ErrorMessage>Page not found</ErrorMessage>
);
export default NotFound;
