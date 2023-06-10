import { React } from "./deps/react.ts";
import { Route, Routes } from "./deps/react_router_dom.ts";

const Home = React.lazy(() => import("./home.tsx"));
const Code = React.lazy(() => import("./code.tsx"));
const NotFound = React.lazy(() => import("./not_found.tsx"));

export const App: React.FC = () => (
  <React.Suspense fallback="Loading…">
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/c/:id" element={<Code />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </React.Suspense>
);
