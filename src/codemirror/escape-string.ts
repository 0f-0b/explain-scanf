import { Extension } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, MatchDecorator, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { stringEscapeRE, stringEscapes } from "../escape";

class EscapeWidget extends WidgetType {
  public constructor(private readonly escape: string) {
    super();
  }

  public eq(other: EscapeWidget): boolean {
    return this.escape == other.escape;
  }

  public toDOM(): HTMLElement {
    return Object.assign(document.createElement("span"), {
      textContent: this.escape
    });
  }

  public ignoreEvent(): boolean {
    return false;
  }
}

class StringEscaper {
  private static readonly decorators = new Map(Array.from(stringEscapes.entries(), ([ch, escape]) => [ch, Decoration.widget({ widget: new EscapeWidget(escape) })]));
  private readonly decorator = new MatchDecorator({
    regexp: stringEscapeRE,
    decoration([match]) {
      const deco = StringEscaper.decorators.get(match);
      if (!deco)
        throw new Error(`Unexpected match '${match}'`);
      return deco;
    },
    boundary: /[^]/
  });
  public decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.decorator.createDeco(view);
  }

  update(update: ViewUpdate) {
    this.decorations = this.decorator.updateDeco(update, this.decorations);
  }
}

const escapeStringExtension = ViewPlugin.fromClass(StringEscaper, { decorations: v => v.decorations });

export function escapeString(): Extension {
  return escapeStringExtension;
}
