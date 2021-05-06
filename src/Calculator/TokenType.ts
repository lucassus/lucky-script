export type BinaryOperator = "+" | "-" | "*" | "/" | "**";

export type UnaryOperator = "+" | "-";

export type Delimiter = "(" | ")";

export type Literal = "number" | "identifier";

export type TokenType =
  | BinaryOperator
  | UnaryOperator
  | Delimiter
  | Literal
  | "eof";
