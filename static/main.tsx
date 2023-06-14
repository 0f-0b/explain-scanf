/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="es2020" />
import { React } from "./deps/react.ts";
import { createRoot } from "./deps/react_dom/client.ts";
import { BrowserRouter } from "./deps/react_router_dom.ts";

import { App } from "./app.tsx";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
