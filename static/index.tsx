import {
  Compartment,
  copyLineDown,
  copyLineUp,
  Decoration,
  deleteLine,
  drawSelection,
  EditorState,
  EditorView,
  highlightActiveLine,
  highlightSpecialChars,
  history,
  historyKeymap,
  hoverTooltip,
  indentUnit,
  keymap,
  lineNumbers,
  moveLineDown,
  moveLineUp,
  selectLine,
  simplifySelection,
  standardKeymap,
  Transaction,
} from "./deps/codemirror.ts";
import type { Extension } from "./deps/codemirror.ts";
import { navigate } from "./deps/reach_router.ts";
import React, { useEffect, useMemo, useState } from "./deps/react.ts";
import { useStorageState } from "./deps/react_storage_hooks.ts";
import { DeclarationNode } from "./components/c_ast_nodes.tsx";
import { enforceSingleLine } from "./components/codemirror/enforce_single_line.ts";
import { escapeString } from "./components/codemirror/escape_string.ts";
import CodeMirror from "./components/codemirror/mod.tsx";
import {
  HlComment,
  HlFunction,
  HlOperator,
  HlString,
  HlVariable,
} from "./components/highlight.tsx";
import ShareButton from "./components/share_button.tsx";
import {
  type ConversionDirective,
  explain,
  parseFormat,
  sscanf,
  undefinedBehavior,
  unimplemented,
} from "./scanf.ts";
import { mapNotNullish } from "./util.ts";

const colors: Decoration[] = [
  Decoration.mark({ class: "color-0" }),
  Decoration.mark({ class: "color-1" }),
  Decoration.mark({ class: "color-2" }),
  Decoration.mark({ class: "color-3" }),
  Decoration.mark({ class: "color-4" }),
  Decoration.mark({ class: "color-5" }),
];

export function color(index: number): Decoration {
  return colors[index % colors.length];
}

const highlight = new Compartment();
const tooltip = new Compartment();
const baseExtension: Extension = [
  EditorState.allowMultipleSelections.of(true),
  indentUnit.of(" "),
  keymap.of([
    ...standardKeymap.filter((binding) => binding.key !== "Enter"),
    ...historyKeymap,
    {
      key: "Tab",
      run({ state, dispatch }) {
        dispatch(
          state.update(state.replaceSelection("\t"), {
            scrollIntoView: true,
            annotations: Transaction.userEvent.of("input"),
          }),
        );
        return true;
      },
    },
    { key: "Alt-ArrowUp", run: moveLineUp, shift: copyLineUp },
    { key: "Alt-ArrowDown", run: moveLineDown, shift: copyLineDown },
    { key: "Escape", run: simplifySelection },
    { key: "Mod-l", run: selectLine },
    { key: "Shift-Mod-k", run: deleteLine },
  ]),
  history(),
  drawSelection(),
];
const formatExtension: Extension = [
  EditorState.tabSize.of(1),
  EditorState.lineSeparator.of("\0"),
  EditorView.contentAttributes.of({
    "aria-label": "Format",
  }),
  keymap.of([
    {
      key: "Enter",
      run({ state, dispatch }) {
        dispatch(
          state.update(state.replaceSelection("\n"), { scrollIntoView: true }),
        );
        return true;
      },
      shift({ state, dispatch }) {
        dispatch(
          state.update(state.replaceSelection("\r"), { scrollIntoView: true }),
        );
        return true;
      },
    },
  ]),
  highlight.of([]),
  tooltip.of([]),
  escapeString(),
  enforceSingleLine(),
  highlightSpecialChars({
    specialChars:
      // deno-lint-ignore no-control-regex
      /[\0-\x08\x0e-\x1f\x7f-\x9f\xad\u061c\u200b\u200e\u200f\u2028\u2029\ufeff\ufff9-\ufffc]/g,
  }),
  baseExtension,
];
const inputExtension: Extension = [
  EditorState.tabSize.of(8),
  EditorState.lineSeparator.of("\n"),
  EditorView.contentAttributes.of({
    "aria-label": "Input",
  }),
  highlight.of([]),
  lineNumbers(),
  highlightActiveLine(),
  highlightSpecialChars(),
  baseExtension,
];

const shortNames = "abcdefghijklmnopqrstuvwxyz";

function name(index: number, count: number): string {
  return count > shortNames.length ? `var_${index + 1}` : shortNames[index];
}

const safeLocalStorage: Parameters<typeof useStorageState>[0] = {
  getItem(key) {
    return localStorage.getItem(key);
  },
  setItem(key, value) {
    return localStorage.setItem(key, value);
  },
  removeItem(key) {
    return localStorage.removeItem(key);
  },
};

export interface IndexLocationState {
  format: string;
  input: string;
}

// deno-lint-ignore no-explicit-any
export default function Index(props: any): JSX.Element {
  const [formatStorage, setFormatStorage] = useStorageState(
    safeLocalStorage,
    "format",
    "%d%f%s",
  );
  const [inputStorage, setInputStorage] = useStorageState(
    safeLocalStorage,
    "input",
    "25 54.32E-1 Hamster\n",
  );
  const [formatState, setFormatState] = useState(() =>
    EditorState.create({
      doc: formatStorage,
      extensions: formatExtension,
    })
  );
  const [inputState, setInputState] = useState(() =>
    EditorState.create({
      doc: inputStorage,
      extensions: inputExtension,
    })
  );
  const format = Array.from(formatState.doc).join("");
  const input = Array.from(inputState.doc).join("");
  useEffect(() => setFormatStorage(format), [format, setFormatStorage]);
  useEffect(() => setInputStorage(input), [input, setInputStorage]);
  const locState: IndexLocationState = props.location.state?.value;
  useEffect(() => {
    if (!locState) {
      return;
    }
    setFormatState((state) =>
      state.update({
        changes: { from: 0, to: state.doc.length, insert: locState.format },
      }).state
    );
    setInputState((state) =>
      state.update({
        changes: { from: 0, to: state.doc.length, insert: locState.input },
      }).state
    );
    navigate("/", {
      replace: true,
    });
  }, [locState]);
  const directives = useMemo(() => parseFormat(format), [format]);
  useEffect(() => {
    const convs = directives === undefinedBehavior
      ? []
      : directives.filter((directive): directive is ConversionDirective =>
        directive.type === "conversion"
      );
    setFormatState((state) =>
      state.update({
        effects: [
          highlight.reconfigure([
            EditorView.decorations.of(Decoration.set(convs.map((conv, index) =>
              color(index).range(conv.start, conv.end)
            ))),
          ]),
          tooltip.reconfigure([
            hoverTooltip((_, pos, side) => {
              const conv = convs.find(({ start, end }) =>
                (start < pos || (side > 0 && start === pos)) &&
                (end > pos || (side < 0 && end === pos))
              );
              return conv === undefined ? null : {
                pos: conv.start + 1,
                create() {
                  return {
                    dom: Object.assign(document.createElement("div"), {
                      textContent: explain(conv),
                    }),
                  };
                },
                arrow: true,
              };
            }),
          ]),
        ],
      }).state
    );
  }, [directives]);
  const result = useMemo(
    () =>
      directives === undefinedBehavior
        ? undefinedBehavior
        : sscanf(input, directives),
    [input, directives],
  );
  useEffect(() => {
    const matches = typeof result === "object" ? result.matches : [];
    setInputState((state) =>
      state.update({
        effects: [
          highlight.reconfigure([
            EditorView.decorations.of(
              Decoration.set(mapNotNullish(matches, (match, index) =>
                match.start !== match.end
                  ? color(index).range(match.start, match.end)
                  : null)),
            ),
          ]),
        ],
      }).state
    );
  }, [result]);
  const args = typeof result === "object" ? result.args : [];
  return (
    <div>
      <ShareButton format={format} input={input} />
      <pre>
        <code>
          <HlFunction>
            <a
              href="https://pubs.opengroup.org/onlinepubs/9699919799/functions/fscanf.html"
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {
                const date = new Date();
                if (date.getMonth() === 3 && date.getDate() === 1) {
                  try {
                    if (sessionStorage.getItem("e") === null) {
                      sessionStorage.setItem("e", "");
                      event.preventDefault();
                      window.open(
                        atob(
                          "aHR0cHM6Ly93d3cuYmlsaWJpbGkuY29tL3ZpZGVvL2F2ODA0MzMwMjI/dD0wLjAwMDAx",
                        ),
                        "_blank",
                        "noreferrer",
                      );
                    }
                  } catch {
                    // ignored
                  }
                }
              }}
            >
              scanf
            </a>
          </HlFunction>(<HlString>
            &quot;<CodeMirror
              className="format"
              state={formatState}
              onChange={setFormatState}
            />&quot;
          </HlString>
          <span>
            {args.map((arg, index, arr) => (
              <React.Fragment key={index}>
                , {arg
                  ? (
                    <>
                      {arg.ref && <HlOperator>&amp;</HlOperator>}
                      <HlVariable>{name(index, arr.length)}</HlVariable>
                    </>
                  )
                  : <HlVariable>NULL</HlVariable>}
              </React.Fragment>
            ))}
          </span>);{" "}
          <HlComment>
            {"// => "}
            <span>
              {result === undefinedBehavior
                ? "undefined behavior"
                : result === unimplemented
                ? "unimplemented"
                : result.ret === -1
                ? "EOF"
                : result.ret}
            </span>
          </HlComment>
        </code>
      </pre>
      <CodeMirror state={inputState} onChange={setInputState} />
      <pre className="variables">
        <code>
          {args.map((arg, index, arr) => (
            <React.Fragment key={index}>
              <DeclarationNode
                ast={{
                  specifiers: arg.specifiers,
                  declarators: [
                    {
                      declarator: {
                        name: name(index, arr.length),
                        type: arg.type,
                      },
                      initializer: arg.initializer,
                    },
                  ],
                }}
              />
              {"\n"}
            </React.Fragment>
          ))}
        </code>
      </pre>
    </div>
  );
}
