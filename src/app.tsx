import { copyLineDown, copyLineUp, deleteLine, moveLineDown, moveLineUp, selectLine, simplifySelection, standardKeymap } from "@codemirror/commands";
import { lineNumbers } from "@codemirror/gutter";
import { history, historyKeymap } from "@codemirror/history";
import { indentUnit } from "@codemirror/language";
import { EditorState, Transaction } from "@codemirror/state";
import { Decoration, drawSelection, EditorView, highlightActiveLine, highlightSpecialChars, keymap } from "@codemirror/view";
import * as React from "react";
import { Fragment, useEffect, useMemo } from "react";
import { useQueryState } from "use-location-state";
import classes from "./app.module.css";
import { DeclarationNode } from "./c-rst";
import { useCodeMirror } from "./codemirror";
import { enforceSingleLine } from "./codemirror/enforce-single-line";
import { escapeString } from "./codemirror/escape-string";
import { HlComment, HlFunction, HlOperator, HlString, HlVariable } from "./highlight";
import { parseFormat, sscanf, undefinedBehavior, unimplemented } from "./scanf";
import { filterMap } from "./util";

const baseExtension = [
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

function name(index: number): string {
  return `var_${index + 1}`;
}

const colors: Decoration[] = [
  Decoration.mark({ class: classes.color0 }),
  Decoration.mark({ class: classes.color1 }),
  Decoration.mark({ class: classes.color2 }),
  Decoration.mark({ class: classes.color3 }),
  Decoration.mark({ class: classes.color4 }),
  Decoration.mark({ class: classes.color5 })
];

function color(index: number): Decoration {
  return colors[index % colors.length];
}

export function App(): JSX.Element {
  const [format, setFormat] = useQueryState("format", "%d%f%s");
  const [formatRef, formatState, setFormatState] = useCodeMirror<HTMLSpanElement>(() => EditorState.create({
    doc: format,
    extensions: [
      EditorState.tabSize.of(1),
      EditorState.lineSeparator.of("\0"),
      keymap.of([
        {
          key: "Enter",
          run({ state, dispatch }) {
            dispatch(state.update(state.replaceSelection("\n"), { scrollIntoView: true }));
            return true;
          }
        },
      ]),
      escapeString(),
      enforceSingleLine(),
      highlightSpecialChars({
        // eslint-disable-next-line no-control-regex
        specialChars: /[\0-\x08\x0e-\x1f\x7f-\x9f\xad\u061c\u200b\u200e\u200f\u2028\u2029\ufeff\ufff9-\ufffc]/g
      }),
      baseExtension
    ]
  }));
  useEffect(() => setFormat(Array.from(formatState.doc).join("")), [formatState.doc, setFormat]);
  const [input, setInput] = useQueryState("input", "25 54.32E-1 Hamster\n");
  const [inputRef, inputState, setInputState] = useCodeMirror<HTMLDivElement>(() => EditorState.create({
    doc: input,
    extensions: [
      EditorState.tabSize.of(8),
      EditorState.lineSeparator.of("\n"),
      lineNumbers(),
      highlightActiveLine(),
      highlightSpecialChars(),
      baseExtension
    ]
  }));
  useEffect(() => setInput(Array.from(inputState.doc).join("")), [inputState.doc, setInput]);
  const directives = useMemo(() => parseFormat(format), [format]);
  const result = useMemo(() => directives === undefinedBehavior ? undefinedBehavior : sscanf(input, directives), [input, directives]);
  const convs = useMemo(() => typeof result === "object" ? result.convs : [], [result]);
  const args = useMemo(() => typeof result === "object" ? result.args : [], [result]);
  useEffect(() => setFormatState(state => state.update({
    reconfigure: {
      color: [
        EditorView.decorations.of(Decoration.set(convs.map((conv, index) => color(index).range(conv.index.start, conv.index.end))))
      ]
    }
  }).state), [convs, setFormatState]);
  useEffect(() => setInputState(state => state.update({
    reconfigure: {
      color: [
        EditorView.decorations.of(Decoration.set(filterMap(convs, (conv, index) => conv.match && conv.match.start !== conv.match.end ? color(index).range(conv.match.start, conv.match.end) : undefined)))
      ]
    }
  }).state), [convs, setInputState]);
  return <div>
    <pre>
      <code><HlFunction><a href="https://pubs.opengroup.org/onlinepubs/9699919799/functions/fscanf.html" target="_blank" rel="noreferrer">scanf</a></HlFunction>(<HlString>&quot;<span className={classes.format} ref={formatRef} />&quot;</HlString><span>{Array.from(args, (arg, index) => <Fragment key={index}>, {arg ? <>{arg.ref && <HlOperator>&amp;</HlOperator>}<HlVariable>{name(index)}</HlVariable></> : <HlVariable>NULL</HlVariable>}</Fragment>)}</span>); <HlComment>{"// => "}<span>{result === undefinedBehavior ? "UB" : result === unimplemented ? "unimplemented" : result.ret === -1 ? "EOF" : result.ret}</span></HlComment></code>
    </pre>
    <div ref={inputRef} />
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
