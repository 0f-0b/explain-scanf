import React from "./deps/react.ts";
import { ErrorMessage } from "./components/error_message.tsx";

export const NotFound: React.FC = () => (
  <ErrorMessage>Not Found</ErrorMessage>
);

export default NotFound;
