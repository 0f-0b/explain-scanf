import { EditorState, type EditorStateConfig } from "@codemirror/state";
import { EditorView, type ViewUpdate } from "@codemirror/view";
import { React, useLayoutEffect, useMemo, useRef } from "react";
import { useLatest } from "use-latest";

export interface CodeMirrorProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  initialConfig?: () => EditorStateConfig;
  onUpdate?: (update: ViewUpdate) => unknown;
}

export const CodeMirror = React.forwardRef<EditorView, CodeMirrorProps>(({
  initialConfig,
  onUpdate,
  ...props
}, ref) => {
  const container = useRef<HTMLDivElement>(null);
  const updateListenerRef = useLatest(onUpdate);
  const initialState = useMemo(() => {
    const { doc, selection, extensions } = initialConfig?.() ?? {};
    const updateListenerExtension = EditorView.updateListener.of(
      (update) => updateListenerRef.current?.(update),
    );
    return EditorState.create({
      doc,
      selection,
      extensions: extensions
        ? [updateListenerExtension, extensions]
        : updateListenerExtension,
    });
  }, []);
  useLayoutEffect(() => {
    const view = new EditorView({
      parent: container.current!,
      state: initialState,
    });
    if (ref) {
      if (typeof ref === "function") {
        ref(view);
      } else {
        ref.current = view;
      }
    }
    return () => view.destroy();
  }, []);
  return <div ref={container} {...props} />;
});
