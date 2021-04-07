export enum TokenType {
  NumberLiteral = "number literal",
  Identifier = "identifier",
  Assigment = "=",

  Plus = "+",
  Minus = "-",
  Multiply = "*",
  Divide = "/",
  Power = "**",

  LeftBracket = "(",
  RightBracket = ")",
  LeftBrace = "{",
  RightBrace = "}",

  KeywordFunction = "keyword:function",

  NewLine = "new line",
  End = "end of input",
}

export class Token {
  constructor(
    public readonly type: TokenType,
    public readonly value: string,
    public readonly position: number
  ) {}
}
