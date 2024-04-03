import { React } from "react";
import { Route, Routes } from "react-router-dom";

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
