import type { React } from "./react.ts";

export default function useLatest<T>(value: T): React.RefObject<T>;
