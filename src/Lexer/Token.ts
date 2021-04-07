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

  // Delimiters
  LeftBracket = "(",
  RightBracket = ")",
  LeftBrace = "{",
  RightBrace = "}",
  NewLine = "\n",

  End = "EndOfInput",
}

export class Token {
  constructor(
    public readonly type: TokenType,
    public readonly value: string,
    public readonly position: number
  ) {}
}
