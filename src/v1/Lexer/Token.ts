export abstract class TokenType {
  protected constructor(public readonly name: string) {}

  toString() {
    return `'${this.name}' ${this.constructor.name.toLowerCase()}`;
  }
}

export class Literal extends TokenType {
  static Number = new Literal("Number");
  static Identifier = new Literal("Identifier");
  static String = new Literal("String");
}

export class Operator extends TokenType {
  static Assigment = new Operator("=");
  static PlusAssign = new Operator("+=");
  static MinusAssign = new Operator("-=");
  static MultiplyAssign = new Operator("*=");
  static DivideAssign = new Operator("/=");

  static Plus = new Operator("+");
  static Minus = new Operator("-");
  static Multiply = new Operator("*");
  static Divide = new Operator("/");
  static Power = new Operator("**");

  static Lt = new Operator("<");
  static Lte = new Operator("<=");
  static Eq = new Operator("==");
  static Neq = new Operator("!=");
  static Gt = new Operator(">");
  static Gte = new Operator(">=");
}

export class Keyword extends TokenType {
  private static values: Keyword[] = [];

  constructor(keyword: string) {
    super(keyword);
    Keyword.values.push(this);
  }

  static Fun = new Keyword("fun");
  static If = new Keyword("if");
  static ElseIf = new Keyword("elseif");
  static Else = new Keyword("else");
  static While = new Keyword("while");
  static Return = new Keyword("return");
  static Nothing = new Keyword("nothing");
  static True = new Keyword("true");
  static False = new Keyword("false");
  static And = new Keyword("and");
  static Or = new Keyword("or");
  static Not = new Keyword("not");
  static Let = new Keyword("let");
  static Break = new Keyword("break");
  static Continue = new Keyword("continue");
  static End = new Keyword("end");
  static Then = new Keyword("then");
  static Do = new Keyword("do");
  static In = new Keyword("in");

  static fromString(string: string): undefined | Keyword {
    return this.values.find((keyword) => keyword.name === string);
  }
}

export class Delimiter extends TokenType {
  static LeftBracket = new Delimiter("(");
  static RightBracket = new Delimiter(")");
  static NewLine = new Delimiter("NewLine");
  static Comma = new Delimiter(",");
  static Eof = new Delimiter("Eof");
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
    public readonly value?: string,
  ) {}
}
