import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { RefObject, SetStateAction, useEffect, useRef, useState } from "react";

export function useCodeMirror<T extends Element>(initialState: () => EditorState): [RefObject<T>, EditorState, (value: SetStateAction<EditorState>) => void] {
  const ref = useRef<T | null>(null);
  const view = useRef<EditorView | null>(null);
  const [state, setState] = useState(initialState);
  useEffect(() => {
    if (view.current)
      view.current.setState(state); // TODO performance
    else if (ref.current)
      view.current = new EditorView({
        state,
        dispatch(tr) {
          setState(tr.state);
        },
        parent: ref.current
      });
  }, [state]);
  useEffect(() => () => view.current?.destroy(), []);
  return [ref, state, setState];
}
