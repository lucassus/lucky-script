export abstract class TokenType {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected constructor(public readonly name: string) {}
}

export class Literal extends TokenType {
  static Number = new Literal("Number");
  static Identifier = new Literal("Identifier");
}

export class Operator extends TokenType {
  static Plus = new Operator("+");
  static Minus = new Operator("-");
  static Multiply = new Operator("*");
  static Divide = new Operator("/");
  static Power = new Operator("**");
  static Assigment = new Operator("=");
}

export class Keyword extends TokenType {
  static Function = new Keyword("function");
  static Return = new Keyword("return");
}

export class Delimiter extends TokenType {
  static LeftBracket = new Delimiter("(");
  static RightBracket = new Delimiter(")");
  static LeftBrace = new Delimiter("{");
  static RightBrace = new Delimiter("}");
  static NewLine = new Delimiter("NewLine");
  static Comma = new Delimiter(",");
  static End = new Delimiter("End");
}

export const Keywords: ReadonlyMap<string, Keyword> = new Map([
  ["function", Keyword.Function],
  ["return", Keyword.Return],
]);

export class Token {
  constructor(
    public readonly type: TokenType,
    public readonly position: number,
    public readonly value?: string
  ) {}
}
