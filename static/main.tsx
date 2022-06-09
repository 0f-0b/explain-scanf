import React from "./deps/react.ts";
import ReactDOM from "./deps/react_dom.ts";
import { App } from "./app.tsx";

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root"),
);
