import { Router } from "@reach/router";
import * as React from "react";
import { Index } from ".";
import "./app.css";
import { Code } from "./code";
import { NotFound } from "./not-found";

export function App(): JSX.Element {
  return <Router>
    <Index path="/" />
    <Code path="/c/:id" />
    <NotFound default />
  </Router>;
}
