import React from "./deps/react.ts";
import ReactDOM from "./deps/react_dom.ts";
import { BrowserRouter } from "./deps/react_router_dom.ts";

import { App } from "./app.tsx";

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root"),
);
