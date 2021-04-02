import { copyLineDown, copyLineUp, deleteLine, moveLineDown, moveLineUp, selectLine, simplifySelection, standardKeymap } from "@codemirror/commands";
import { lineNumbers } from "@codemirror/gutter";
import { history, historyKeymap } from "@codemirror/history";
import { indentUnit } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { Compartment, EditorState, Transaction } from "@codemirror/state";
import { Decoration, drawSelection, EditorView, highlightActiveLine, highlightSpecialChars, keymap } from "@codemirror/view";
import type { RouteComponentProps } from "@reach/router";
import * as React from "react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useStorageState } from "react-storage-hooks";
import { DeclarationNode } from "./components/c-rst";
import { CodeMirror } from "./components/codemirror";
import { enforceSingleLine } from "./components/codemirror/enforce-single-line";
import { escapeString } from "./components/codemirror/escape-string";
import { HlComment, HlFunction, HlOperator, HlString, HlVariable } from "./components/highlight";
import { ShareButton } from "./components/share-button";
import classes from "./index.module.css";
import { parseFormat, sscanf, undefinedBehavior, unimplemented } from "./scanf";
import type { FirstParameter } from "./util";
import { filterMap } from "./util";

const localStorage: FirstParameter<typeof useStorageState> = (() => {
  try {
    const localStorage = window.localStorage;
    if (typeof localStorage === "object")
      return localStorage;
  } catch (_) {
    // ignore
  }
  return {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined
  };
})();

const colors: Decoration[] = [
  Decoration.mark({ class: classes.color0 }),
  Decoration.mark({ class: classes.color1 }),
  Decoration.mark({ class: classes.color2 }),
  Decoration.mark({ class: classes.color3 }),
  Decoration.mark({ class: classes.color4 }),
  Decoration.mark({ class: classes.color5 })
];

export function color(index: number): Decoration {
  return colors[index % colors.length];
}

const highlight = new Compartment;
const baseExtension: Extension = [
  EditorState.allowMultipleSelections.of(true),
  indentUnit.of(" "),
  keymap.of([
    ...standardKeymap.filter(binding => binding.key !== "Enter"),
    ...historyKeymap,
    {
      key: "Tab",
      run({ state, dispatch }) {
        dispatch(state.update(state.replaceSelection("\t"), { scrollIntoView: true, annotations: Transaction.userEvent.of("input") }));
        return true;
      }
    },
    { key: "Alt-ArrowUp", run: moveLineUp, shift: copyLineUp },
    { key: "Alt-ArrowDown", run: moveLineDown, shift: copyLineDown },
    { key: "Escape", run: simplifySelection },
    { key: "Mod-l", run: selectLine },
    { key: "Shift-Mod-k", run: deleteLine }
  ]),
  history(),
  drawSelection()
];
const formatExtension: Extension = [
  EditorState.tabSize.of(1),
  EditorState.lineSeparator.of("\0"),
  keymap.of([
    {
      key: "Enter",
      run({ state, dispatch }) {
        dispatch(state.update(state.replaceSelection("\n"), { scrollIntoView: true }));
        return true;
      },
      shift({ state, dispatch }) {
        dispatch(state.update(state.replaceSelection("\r"), { scrollIntoView: true }));
        return true;
      }
    }
  ]),
  highlight.of([]),
  escapeString(),
  enforceSingleLine(),
  highlightSpecialChars({
    // eslint-disable-next-line no-control-regex
    specialChars: /[\0-\x08\x0e-\x1f\x7f-\x9f\xad\u061c\u200b\u200e\u200f\u2028\u2029\ufeff\ufff9-\ufffc]/g
  }),
  baseExtension
];
const inputExtension = [
  EditorState.tabSize.of(8),
  EditorState.lineSeparator.of("\n"),
  highlight.of([]),
  lineNumbers(),
  highlightActiveLine(),
  highlightSpecialChars(),
  baseExtension
];

function name(index: number): string {
  return `var_${index + 1}`;
}

export interface IndexLocationState {
  format: string;
  input: string;
}

export function Index(props: RouteComponentProps): JSX.Element {
  const [formatStorage, setFormatStorage] = useStorageState(localStorage, "format", "%d%f%s");
  const [inputStorage, setInputStorage] = useStorageState(localStorage, "input", "25 54.32E-1 Hamster\n");
  const [formatState, setFormatState] = useState(() => EditorState.create({
    doc: formatStorage,
    extensions: formatExtension
  }));
  const [inputState, setInputState] = useState(() => EditorState.create({
    doc: inputStorage,
    extensions: inputExtension
  }));
  const format = Array.from(formatState.doc).join("");
  const input = Array.from(inputState.doc).join("");
  useEffect(() => setFormatStorage(format), [format, setFormatStorage]);
  useEffect(() => setInputStorage(input), [input, setInputStorage]);
  const locationState = (props.location as { state: IndexLocationState & { key: string; } | null; }).state;
  useEffect(() => {
    if (locationState === null)
      return;
    setFormatState(state => state.update({
      changes: { from: 0, to: state.doc.length, insert: locationState.format }
    }).state);
    setInputState(state => state.update({
      changes: { from: 0, to: state.doc.length, insert: locationState.input }
    }).state);
  }, [locationState]);
  const directives = useMemo(() => parseFormat(format), [format]);
  const result = useMemo(() => directives === undefinedBehavior ? undefinedBehavior : sscanf(input, directives), [input, directives]);
  const convs = useMemo(() => typeof result === "object" ? result.convs : [], [result]);
  const args = useMemo(() => typeof result === "object" ? result.args : [], [result]);
  useEffect(() => {
    setFormatState(state => state.update({
      effects: [
        highlight.reconfigure([
          EditorView.decorations.of(Decoration.set(convs.map((conv, index) => color(index).range(conv.index.start, conv.index.end))))
        ])
      ]
    }).state);
    setInputState(state => state.update({
      effects: [
        highlight.reconfigure([
          EditorView.decorations.of(Decoration.set(filterMap(convs, (conv, index) => conv.match && conv.match.start !== conv.match.end ? color(index).range(conv.match.start, conv.match.end) : undefined)))
        ])
      ]
    }).state);
  }, [convs]);
  return <div>
    <ShareButton format={format} input={input} />
    <pre>
      <code><HlFunction><a href="https://pubs.opengroup.org/onlinepubs/9699919799/functions/fscanf.html" target="_blank" rel="noreferrer" onClick={event => (date => date.getMonth() === 3 && date.getDate() === 1)(new Date) && void new Promise((resolve, reject) => sessionStorage.getItem("e") === null ? resolve(sessionStorage.setItem("e", "")) : reject()).then(() => (event.preventDefault(), window.open(atob("aHR0cHM6Ly93d3cuYmlsaWJpbGkuY29tL3ZpZGVvL2F2ODA0MzMwMjI/dD0wLjAwMDAx"), "_blank", "noreferrer")), () => undefined)}>scanf</a></HlFunction>(<HlString>&quot;<CodeMirror className={classes.format} state={formatState} onChange={setFormatState} />&quot;</HlString><span>{Array.from(args, (arg, index) => <Fragment key={index}>, {arg ? <>{arg.ref && <HlOperator>&amp;</HlOperator>}<HlVariable>{name(index)}</HlVariable></> : <HlVariable>NULL</HlVariable>}</Fragment>)}</span>); <HlComment>{"// => "}<span>{result === undefinedBehavior ? "UB" : result === unimplemented ? "unimplemented" : result.ret === -1 ? "EOF" : result.ret}</span></HlComment></code>{/* help */}
    </pre>
    <CodeMirror state={inputState} onChange={setInputState} />
    <pre className={classes.variables}>
      <code>{args.map((arg, index) => <Fragment key={index}><DeclarationNode ast={{
        specifiers: arg.specifiers,
        declarators: [
          {
            declarator: {
              name: name(index),
              type: arg.type
            },
            initializer: arg.initializer
          }
        ]
      }} />{"\n"}</Fragment>)}</code>
    </pre>
  </div>;
}
