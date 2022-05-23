import type { EditorState } from "../../deps/codemirror.ts";
import { EditorView } from "../../deps/codemirror.ts";
import React, { useEffect, useRef } from "../../deps/react.ts";
import { useLatest } from "../../deps/use_latest.ts";

export interface CodeMirrorProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "children" | "onChange"> {
  state: EditorState;
  onChange: (state: EditorState) => void;
}

export default function CodeMirror(
  { state, onChange, ...props }: CodeMirrorProps,
): JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null);
  const view = useRef<EditorView | null>(null);
  const cbRef = useLatest(onChange);
  useEffect(() => {
    // TODO performance
    view.current?.setState(state);
  }, [state]);
  useEffect(() => {
    if (!ref.current) {
      return;
    }
    view.current = new EditorView({
      state,
      dispatch(tr) {
        cbRef.current(tr.state);
      },
      parent: ref.current,
    });
    return () => view.current?.destroy();
  }, []);
  return <div ref={ref} {...props} />;
}
