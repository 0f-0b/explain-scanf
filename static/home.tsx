/* @jsxImportSource react */

import {
  copyLineDown,
  copyLineUp,
  deleteLine,
  history,
  historyKeymap,
  moveLineDown,
  moveLineUp,
  selectLine,
  simplifySelection,
  standardKeymap,
} from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import {
  Compartment,
  EditorState,
  type Extension,
  Transaction,
} from "@codemirror/state";
import {
  Decoration,
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightSpecialChars,
  hoverTooltip,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import {
  Fragment,
  type React,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { type Location, useLocation, useNavigate } from "react-router-dom";

import type { Code } from "./api.ts";
import { enforceSingleLine } from "./codemirror/enforce_single_line.ts";
import { escapeString } from "./codemirror/escape_string.ts";
import { DeclarationNode } from "./components/c_ast_nodes.tsx";
import { CodeMirror } from "./components/codemirror.tsx";
import {
  HlComment,
  HlFunction,
  HlOperator,
  HlString,
  HlVariable,
} from "./components/highlight.tsx";
import { ScanfLink } from "./components/scanf_link.tsx";
import { ShareButton } from "./components/share_button.tsx";
import {
  explain,
  parseFormat,
  sscanf,
  undefinedBehavior,
  unimplemented,
} from "./scanf.ts";
import { useStorageState } from "./use_storage_state.ts";

const colors = [
  Decoration.mark({ class: "color-0" }),
  Decoration.mark({ class: "color-1" }),
  Decoration.mark({ class: "color-2" }),
  Decoration.mark({ class: "color-3" }),
  Decoration.mark({ class: "color-4" }),
  Decoration.mark({ class: "color-5" }),
];

function color(index: number): Decoration {
  return colors[index % colors.length];
}

const shortNames = "abcdefghijklmnopqrstuvwxyz";

function name(index: number, count: number): string {
  return count > shortNames.length ? `var_${index + 1}` : shortNames[index];
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
        dispatch(state.update(
          state.replaceSelection("\n"),
          { scrollIntoView: true },
        ));
        return true;
      },
      shift({ state, dispatch }) {
        dispatch(state.update(
          state.replaceSelection("\r"),
          { scrollIntoView: true },
        ));
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

export interface HomeLocationState {
  code: Code;
}

const getLocalStorage = () => localStorage;

export const Home: React.FC = () => {
  const [format, setFormat] = useStorageState(
    getLocalStorage,
    "format",
    "%d%f%s",
  );
  const [input, setInput] = useStorageState(
    getLocalStorage,
    "input",
    "25 54.32E-1 Hamster\n",
  );
  const formatView = useRef<EditorView>(null);
  const inputView = useRef<EditorView>(null);
  const navigate = useNavigate();
  const location = useLocation() as Location<HomeLocationState | null>;
  useLayoutEffect(() => {
    const oldFormat = formatView.current!.state.doc.toString();
    if (format !== oldFormat) {
      formatView.current!.dispatch({
        changes: { from: 0, to: oldFormat.length, insert: format },
      });
    }
  }, [format]);
  useLayoutEffect(() => {
    const oldInput = inputView.current!.state.doc.toString();
    if (input !== oldInput) {
      inputView.current!.dispatch({
        changes: { from: 0, to: oldInput.length, insert: input },
      });
    }
  }, [input]);
  useEffect(() => {
    if (location.state) {
      const { format, input } = location.state.code;
      setFormat(format);
      setInput(input);
      navigate("/", { replace: true });
    }
  }, [location.state]);
  const directives = useMemo(() => parseFormat(format), [format]);
  useLayoutEffect(() => {
    const convs = directives === undefinedBehavior
      ? []
      : directives.filter((directive) => directive.type === "conversion");
    formatView.current!.dispatch({
      effects: [
        highlight.reconfigure(EditorView.decorations.of(Decoration.set(
          convs.map(({ start, end }, index) => color(index).range(start, end)),
        ))),
        tooltip.reconfigure(hoverTooltip((_, pos, side) => {
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
        })),
      ],
    });
  }, [directives]);
  const result = useMemo(
    () =>
      directives === undefinedBehavior
        ? undefinedBehavior
        : sscanf(input, directives),
    [input, directives],
  );
  useLayoutEffect(() => {
    const matches = typeof result === "object" ? result.matches : [];
    inputView.current!.dispatch({
      effects: [
        highlight.reconfigure(EditorView.decorations.of(Decoration.set(
          matches
            .filter(({ start, end }) => start !== end)
            .map(({ start, end }, index) => color(index).range(start, end)),
        ))),
      ],
    });
  }, [result]);
  const args = typeof result === "object" ? result.args : [];
  return (
    <div>
      <ShareButton code={{ format, input }} />
      <pre>
        <code>
          <HlFunction>
            <ScanfLink />
          </HlFunction>
          {"("}
          <HlString>
            "
            <CodeMirror
              ref={formatView}
              className="format"
              initialConfig={() => ({
                doc: format,
                extensions: formatExtension,
              })}
              onUpdate={(update) => {
                if (update.docChanged) {
                  setFormat(update.state.doc.toString());
                }
              }}
            />
            "
          </HlString>
          {args.map((arg, index, arr) => (
            <Fragment key={index}>
              {", "}
              {arg
                ? (
                  <>
                    {arg.ref && <HlOperator>&amp;</HlOperator>}
                    <HlVariable>{name(index, arr.length)}</HlVariable>
                  </>
                )
                : <HlVariable>NULL</HlVariable>}
            </Fragment>
          ))}
          {"); "}
          <HlComment>
            {`// => ${
              result === undefinedBehavior
                ? "undefined behavior"
                : result === unimplemented
                ? "unimplemented"
                : result.ret === -1
                ? "EOF"
                : result.ret
            }`}
          </HlComment>
        </code>
      </pre>
      <CodeMirror
        ref={inputView}
        initialConfig={() => ({
          doc: input,
          extensions: inputExtension,
        })}
        onUpdate={(update) => {
          if (update.docChanged) {
            setInput(update.state.doc.toString());
          }
        }}
      />
      <pre className="variables">
        <code>
          {args.map((arg, index, arr) => (
            <Fragment key={index}>
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
              {arg.comment === undefined || (
                <>
                  {" "}
                  <HlComment>{`// ${arg.comment}`}</HlComment>
                </>
              )}
              {"\n"}
            </Fragment>
          ))}
        </code>
      </pre>
    </div>
  );
};
export default Home;
