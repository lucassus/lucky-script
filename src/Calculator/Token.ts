export type Operator = "+" | "-" | "*" | "/" | "**";
export type Delimiter = "(" | ")";
export type Literal = "number" | "identifier";
export type TokenType = Operator | Delimiter | Literal | "eof";

export class Token {
  constructor(
    public position: number,
    public type: TokenType,
    public value?: string | number
  ) {}
}
