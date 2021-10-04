import type { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { ComponentPropsWithoutRef } from "react";
import { useEffect, useRef } from "react";
import useLatest from "use-latest";

export interface CodeMirrorProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onChange"> {
  state: EditorState;
  onChange: (state: EditorState) => void;
}

export default function CodeMirror({ state, onChange, ...props }: CodeMirrorProps): JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null);
  const view = useRef<EditorView | null>(null);
  const cbRef = useLatest(onChange);
  useEffect(() => view.current?.setState(state) /* TODO performance */, [state]);
  useEffect(() => {
    if (!ref.current)
      return;
    view.current = new EditorView({
      state,
      dispatch(tr) {
        cbRef.current(tr.state);
      },
      parent: ref.current
    });
    return () => view.current?.destroy();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <div ref={ref} {...props} />;
}
