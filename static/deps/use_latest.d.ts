import type { React } from "react";

export default function useLatest<T>(value: T): Readonly<React.RefObject<T>>;
