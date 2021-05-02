export enum TokenType {
  // Literals
  NumberLiteral = "NUMBER",
  Identifier = "IDENTIFIER",

  // Operators
  Plus = "+",
  Minus = "-",
  Multiply = "*",
  Divide = "/",
  Power = "**",
  Assigment = "=",

  // Keywords
  Function = "function",
  Return = "return",

  // Delimiters
  LeftBracket = "(",
  RightBracket = ")",
  LeftBrace = "{",
  RightBrace = "}",
  NewLine = "\n",
  Comma = ",",

  End = "EndOfInput",
}

export const Keywords: ReadonlyMap<string, TokenType> = new Map([
  ["function", TokenType.Function],
  ["return", TokenType.Return],
]);

export class Token {
  constructor(
    public readonly type: TokenType,
    public readonly position: number,
    public readonly value?: string
  ) {}
}
