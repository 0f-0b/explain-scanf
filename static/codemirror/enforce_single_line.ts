import {
  type ChangeSpec,
  EditorState,
  type Extension,
} from "@codemirror/state";

const enforceSingleLineExtension = EditorState.transactionFilter.of((tr) => {
  if (!tr.docChanged) {
    return tr;
  }
  const changes: ChangeSpec[] = [];
  for (let it = tr.newDoc.iter(), index = 0; !it.done; it.next()) {
    if (it.lineBreak) {
      changes.push({ from: index, to: index + 1 });
    }
    index += it.value.length;
  }
  return [tr, { changes, sequential: true }];
});

export function enforceSingleLine(): Extension {
  return enforceSingleLineExtension;
}
