import { TreeCursor } from "./tree.d.ts";
import { Input, Parser, ParseWrapper } from "./parse.d.ts";
export interface NestedParse {
    parser: Parser;
    overlay?: readonly {
        from: number;
        to: number;
    }[] | ((node: TreeCursor) => {
        from: number;
        to: number;
    } | boolean);
}
export declare function parseMixed(nest: (node: TreeCursor, input: Input) => NestedParse | null): ParseWrapper;
