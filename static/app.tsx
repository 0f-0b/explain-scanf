/* @jsxImportSource react */

import { lazy, type React, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

const Home = lazy(() => import("./home.tsx"));
const Code = lazy(() => import("./code.tsx"));
const NotFound = lazy(() => import("./not_found.tsx"));

export const App: React.FC = () => (
  <Suspense fallback="Loading…">
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/c/:id" element={<Code />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);
