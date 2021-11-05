import { Router } from "./deps/reach-router.ts";
import React from "./deps/react.ts";

const Index = React.lazy(() => import("./index.tsx"));
const Code = React.lazy(() => import("./code.tsx"));
const NotFound = React.lazy(() => import("./not-found.tsx"));

export default function App(): JSX.Element {
  return (
    <React.Suspense fallback="Loading…">
      <Router>
        <Index path="/" />
        <Code path="/c/:id" />
        <NotFound default />
      </Router>
    </React.Suspense>
  );
}
