import { completionKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, defaultTabBinding } from "@codemirror/commands";
import { lineNumbers } from "@codemirror/gutter";
import { history, historyKeymap } from "@codemirror/history";
import { indentUnit } from "@codemirror/language";
import { ChangeSpec, EditorState } from "@codemirror/state";
import { Decoration, drawSelection, EditorView, highlightActiveLine, highlightSpecialChars, keymap } from "@codemirror/view";
import * as React from "react";
import { Fragment, useEffect, useMemo } from "react";
import * as ReactDOM from "react-dom";
import { useQueryState } from "use-location-state";
import { DeclarationNode } from "./c-rst";
import { useCodeMirror } from "./codemirror";
import { HlComment, HlFunction, HlOperator, HlString, HlVariable } from "./highlight";
import { parseFormat, sscanf, unimplemented } from "./scanf";
import { filterMap } from "./util";

const base = [
  highlightSpecialChars(),
  history(),
  drawSelection(),
  EditorState.allowMultipleSelections.of(true),
  EditorState.tabSize.of(8),
  EditorState.lineSeparator.of("\n"),
  indentUnit.of(" "),
  keymap.of([
    ...defaultKeymap,
    defaultTabBinding,
    ...historyKeymap,
    ...completionKeymap
  ])
];
const enforceSingleLine = EditorState.transactionFilter.of(tr => {
  if (!tr.docChanged)
    return tr;
  const doc = Array.from(tr.newDoc).join("");
  const changes: ChangeSpec[] = [];
  const re = /[\n\r]/g;
  for (let match: RegExpExecArray | null; (match = re.exec(doc));)
    changes.push({ from: match.index, to: match.index + 1 });
  return [tr, { changes, sequential: true }];
});
const colors: Decoration[] = [
  Decoration.mark({ class: "color-0" }),
  Decoration.mark({ class: "color-1" }),
  Decoration.mark({ class: "color-2" }),
  Decoration.mark({ class: "color-3" }),
  Decoration.mark({ class: "color-4" }),
  Decoration.mark({ class: "color-5" })
];

function color(index: number): Decoration {
  return colors[index % colors.length];
}

function name(index: number): string {
  return `var_${index + 1}`;
}

function App(): JSX.Element {
  const [format, setFormat] = useQueryState("format", "%d%f%s");
  const [formatRef, formatState, setFormatState] = useCodeMirror<HTMLSpanElement>(() => EditorState.create({
    doc: format,
    extensions: [
      ...base,
      enforceSingleLine
    ]
  }));
  useEffect(() => setFormat(Array.from(formatState.doc).join("")), [formatState.doc, setFormat]);
  const [input, setInput] = useQueryState("input", "25 54.32E-1 Hamster\n");
  const [inputRef, inputState, setInputState] = useCodeMirror<HTMLDivElement>(() => EditorState.create({
    doc: input,
    extensions: [
      ...base,
      lineNumbers(),
      highlightActiveLine()
    ]
  }));
  useEffect(() => setInput(Array.from(inputState.doc).join("")), [inputState.doc, setInput]);
  const directives = useMemo(() => parseFormat(format), [format]);
  const result = useMemo(() => directives ? sscanf(input, directives) : undefined, [input, directives]);
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
    <div>
      <code><HlFunction>scanf</HlFunction>(<HlString>&quot;<span className="format" ref={formatRef} />&quot;</HlString><span>{Array.from(args, (arg, index) => <Fragment key={index}>, {arg ? <>{arg.ref && <HlOperator>&amp;</HlOperator>}<HlVariable>{name(index)}</HlVariable></> : <HlVariable>NULL</HlVariable>}</Fragment>)}</span>); <HlComment>{"// => "}<span>{result === undefined ? "UB" : result === unimplemented ? "unimplemented" : result.ret === -1 ? "EOF" : result.ret}</span></HlComment></code>
    </div>
    <div ref={inputRef} />
    <pre className="variables">
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
      }} /><br /></Fragment>)}</code>
    </pre>
  </div>;
}

ReactDOM.render(<App />, document.getElementById("root"));
