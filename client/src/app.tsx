import { Router } from "@reach/router";
import { lazy, Suspense } from "react";
import "./app.css";

const Index = lazy(() => import("."));
const Code = lazy(() => import("./code"));
const NotFound = lazy(() => import("./not-found"));

export default function App(): JSX.Element {
  return <Suspense fallback="Loading…">
    <Router>
      <Index path="/" />
      <Code path="/c/:id" />
      <NotFound default />
    </Router>
  </Suspense>;
}
