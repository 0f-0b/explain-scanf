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
import { type Location, useLocation, useNavigate } from "react-router";

import type { Code } from "./api.ts";
import { enforceSingleLine } from "./codemirror/enforce_single_line.ts";
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
import { encodeUtf8ByteString, getUtf16Indices } from "./encoding.ts";
import { explain, type FormatDirective, parseFormat, sscanf } from "./scanf.ts";
import { unescapeString } from "./unescape.ts";
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
  EditorState.tabSize.of(8),
  EditorState.lineSeparator.of("\n"),
  EditorView.theme({
    ".cm-specialChar": {
      color: "white",
      backgroundColor: "darkred",
    },
    ".cm-tooltip-section": {
      fontSize: "15px",
      whiteSpace: "pre-line",
      padding: "2px",
    },
  }),
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
  highlightSpecialChars(),
];
const formatExtension: Extension = [
  EditorView.theme({ ".cm-line": { padding: "0 1px" } }),
  EditorView.contentAttributes.of({ "aria-label": "Format" }),
  highlight.of([]),
  tooltip.of([]),
  enforceSingleLine(),
  baseExtension,
];
const inputExtension: Extension = [
  EditorView.contentAttributes.of({ "aria-label": "Input" }),
  highlight.of([]),
  lineNumbers(),
  highlightActiveLine(),
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
  const parseResult = useMemo(():
    | { type: "success"; directives: readonly FormatDirective[] }
    | { type: "invalid string literal" }
    | { type: "undefined behavior" } => {
    const unescapeResult = unescapeString(format);
    if (!unescapeResult) {
      return { type: "invalid string literal" };
    }
    const nulPos = unescapeResult.result.indexOf("\0");
    if (nulPos !== -1) {
      unescapeResult.result = unescapeResult.result.substring(0, nulPos);
    }
    const parseResult = parseFormat(unescapeResult.result);
    if (parseResult.type !== "success") {
      return parseResult;
    }
    for (const directive of parseResult.directives) {
      if (directive.type === "conversion") {
        directive.start = unescapeResult.indices[directive.start];
        directive.end = unescapeResult.indices[directive.end];
      }
    }
    return parseResult;
  }, [format]);
  useLayoutEffect(() => {
    const convs = parseResult.type === "success"
      ? parseResult.directives
        .filter((directive) => directive.type === "conversion")
      : [];
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
  }, [parseResult]);
  const convertResult = useMemo(() => {
    if (parseResult.type !== "success") {
      return parseResult;
    }
    const convertResult = sscanf(
      encodeUtf8ByteString(input),
      parseResult.directives,
    );
    if (convertResult.type !== "success") {
      return convertResult;
    }
    const indices = getUtf16Indices(input);
    for (const match of convertResult.matches) {
      match.start = indices[match.start];
      match.end = indices[match.end];
    }
    return convertResult;
  }, [input, parseResult]);
  useLayoutEffect(() => {
    const matches = convertResult.type === "success"
      ? convertResult.matches
      : [];
    inputView.current!.dispatch({
      effects: [
        highlight.reconfigure(EditorView.decorations.of(Decoration.set(
          matches
            .filter(({ start, end }) => start !== end)
            .map(({ start, end }, index) => color(index).range(start, end)),
        ))),
      ],
    });
  }, [convertResult]);
  const args = convertResult.type === "success" ? convertResult.args : [];
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
          {Array.from(args, (arg, index) => (
            <Fragment key={index}>
              {", "}
              {arg
                ? (
                  <>
                    {arg.ref && <HlOperator>&amp;</HlOperator>}
                    <HlVariable>{name(index, args.length)}</HlVariable>
                  </>
                )
                : <HlVariable>NULL</HlVariable>}
            </Fragment>
          ))}
          {"); "}
          <HlComment>
            {`// => ${(() => {
              switch (convertResult.type) {
                case "success":
                  return convertResult.returnValue === -1
                    ? "EOF"
                    : convertResult.returnValue;
                case "invalid string literal":
                  return "invalid string literal";
                case "undefined behavior":
                  return "undefined behavior";
                case "unimplemented":
                  return "unimplemented";
              }
            })()}`}
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
