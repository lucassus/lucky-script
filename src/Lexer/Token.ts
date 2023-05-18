export abstract class TokenType {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected constructor(public readonly name: string) {}

  toString() {
    return `'${this.name}' ${this.constructor.name.toLowerCase()}`;
  }
}

export class Literal extends TokenType {
  static Number = new Literal("Number");
  static Identifier = new Literal("Identifier");
}

export class Operator extends TokenType {
  static Assigment = new Operator("=");

  static Plus = new Operator("+");
  static Minus = new Operator("-");
  static Multiply = new Operator("*");
  static Divide = new Operator("/");
  static Power = new Operator("**");

  static Lt = new Operator("<");
  static Lte = new Operator("<=");
  static Eq = new Operator("==");
  static Gt = new Operator(">");
  static Gte = new Operator(">=");
}

export class Keyword extends TokenType {
  private static values: Keyword[] = [];

  constructor(keyword: string) {
    super(keyword);
    Keyword.values.push(this);
  }

  static Function = new Keyword("function");
  static If = new Keyword("if");
  static Return = new Keyword("return");

  static fromString(string: string): undefined | Keyword {
    return this.values.find((keyword) => keyword.name === string);
  }
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

export interface Location {
  readonly position: number;
  readonly line: number;
  readonly column: number;
}

export class Token {
  constructor(
    public readonly type: TokenType,
    public readonly location: Location,
    public readonly value?: string
  ) {}
}
