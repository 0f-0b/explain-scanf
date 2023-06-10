import { React } from "../deps/react.ts";

export type HlProps = React.PropsWithChildren;
export const HlKeyword: React.FC<HlProps> = ({ children }) => (
  <span className="hl-keyword">{children}</span>
);
export const HlNumeric: React.FC<HlProps> = ({ children }) => (
  <span className="hl-numeric">{children}</span>
);
export const HlString: React.FC<HlProps> = ({ children }) => (
  <span className="hl-string">{children}</span>
);
export const HlOperator: React.FC<HlProps> = ({ children }) => (
  <span className="hl-operator">{children}</span>
);
export const HlBasicType: React.FC<HlProps> = ({ children }) => (
  <span className="hl-basic-type">{children}</span>
);
export const HlType: React.FC<HlProps> = ({ children }) => (
  <span className="hl-type">{children}</span>
);
export const HlFunction: React.FC<HlProps> = ({ children }) => (
  <span className="hl-function">{children}</span>
);
export const HlVariable: React.FC<HlProps> = ({ children }) => (
  <span className="hl-variable">{children}</span>
);
export const HlMacro: React.FC<HlProps> = ({ children }) => (
  <span className="hl-macro">{children}</span>
);
export const HlComment: React.FC<HlProps> = ({ children }) => (
  <span className="hl-comment">{children}</span>
);
