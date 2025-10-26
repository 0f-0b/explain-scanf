/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/* @jsxRuntime automatic */
/* @jsxImportSource react */

import "./register_sw.ts";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { App } from "./app.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
