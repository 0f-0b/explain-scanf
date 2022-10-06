import React from "./deps/react.ts";

import { ErrorMessage } from "./components/error_message.tsx";

export const NotFound: React.FC = () => (
  <ErrorMessage>Page not found</ErrorMessage>
);
export default NotFound;
