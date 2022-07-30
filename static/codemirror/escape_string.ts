import type { Extension } from "../deps/codemirror/state.ts";
import {
  Decoration,
  type DecorationSet,
  type EditorView,
  MatchDecorator,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "../deps/codemirror/view.ts";

import { stringEscapeRE, stringEscapes } from "../escape.ts";

class EscapeWidget extends WidgetType {
  readonly #escape: string;

  constructor(escape: string) {
    super();
    this.#escape = escape;
  }

  override toDOM(): HTMLElement {
    return Object.assign(document.createElement("span"), {
      textContent: this.#escape,
    });
  }

  override eq(other: EscapeWidget): boolean {
    return this.#escape == other.#escape;
  }

  override ignoreEvent(): boolean {
    return false;
  }
}

class StringEscaper {
  static readonly #decorators = new Map(
    Array.from(
      stringEscapes.entries(),
      ([ch, escape]) => [
        ch,
        Decoration.widget({ widget: new EscapeWidget(escape) }),
      ],
    ),
  );
  readonly #decorator = new MatchDecorator({
    regexp: stringEscapeRE,
    decoration([match]) {
      const deco = StringEscaper.#decorators.get(match);
      if (!deco) {
        throw new Error(`Unexpected match '${match}'`);
      }
      return deco;
    },
    boundary: /[^]/,
  });
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.#decorator.createDeco(view);
  }

  update(update: ViewUpdate) {
    this.decorations = this.#decorator.updateDeco(update, this.decorations);
  }
}

const escapeStringExtension = ViewPlugin.fromClass(StringEscaper, {
  decorations: (v) => v.decorations,
});

export function escapeString(): Extension {
  return escapeStringExtension;
}
