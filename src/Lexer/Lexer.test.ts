import { IllegalSymbolError } from "./errors";
import { Lexer } from "./Lexer";
import {
  Token,
  Location,
  Delimiter,
  Keyword,
  Literal,
  Operator,
} from "./Token";

const anyLocation = expect.objectContaining<Location>({
  position: expect.any(Number),
  line: expect.any(Number),
  column: expect.any(Number),
});

describe("Lexer", () => {
  it("tokenizes an empty input", () => {
    const lexer = new Lexer("");

    expect(lexer.nextToken()).toEqual(new Token(Delimiter.End, anyLocation));
  });

  describe("statements separators", () => {
    it("tokenizes new lines", () => {
      const lexer = new Lexer("\n1\n2\n\n");
      const tokens = [...lexer.tokenize()];

      expect(tokens.length).toBe(7);
      expect(tokens).toEqual([
        new Token(Delimiter.NewLine, anyLocation),
        new Token(Literal.Number, anyLocation, "1"),
        new Token(Delimiter.NewLine, anyLocation),
        new Token(Literal.Number, anyLocation, "2"),
        new Token(Delimiter.NewLine, anyLocation),
        new Token(Delimiter.NewLine, anyLocation),
        new Token(Delimiter.End, anyLocation),
      ]);
    });

    it("tokenizes semicolons", () => {
      const lexer = new Lexer(";");
      const tokens = [...lexer.tokenize()];

      expect(tokens.length).toBe(2);
      expect(tokens).toEqual([
        new Token(Delimiter.NewLine, anyLocation),
        new Token(Delimiter.End, anyLocation),
      ]);
    });
  });

  it.each`
    input
    ${"1+2"}
    ${" 1 + 2 "}
    ${"\t1\t+\t2\t"}
    ${"1 + \t \t 2"}
  `("ignores whitespaces", ({ input }) => {
    const lexer = new Lexer(input);
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(4);
    expect(tokens).toEqual([
      new Token(Literal.Number, anyLocation, "1"),
      new Token(Operator.Plus, anyLocation),
      new Token(Literal.Number, anyLocation, "2"),
      new Token(Delimiter.End, anyLocation),
    ]);
  });

  it.each`
    input
    ${"\nfirst\nsecond\n"}
    ${"# A comment that takes the whole line\nfirst\nsecond\n"}
    ${"\nfirst # A comment in the same like\nsecond\n # The last comment"}
  `("ignores comments", ({ input }) => {
    const lexer = new Lexer(input);
    const tokens = [...lexer.tokenize()];

    expect(tokens).toEqual([
      new Token(Delimiter.NewLine, anyLocation),
      new Token(Literal.Identifier, anyLocation, "first"),
      new Token(Delimiter.NewLine, anyLocation),
      new Token(Literal.Identifier, anyLocation, "second"),
      new Token(Delimiter.NewLine, anyLocation),
      new Token(Delimiter.End, anyLocation),
    ]);
  });

  describe("number literals", () => {
    it.each`
      input
      ${"0"}
      ${"1"}
      ${"41"}
      ${"1_000"}
      ${"1_000_000"}
    `("recognizes integer numeral, like $input", ({ input }) => {
      const lexer = new Lexer(input);
      expect(lexer.nextToken()).toEqual(
        new Token(Literal.Number, anyLocation, input)
      );
    });

    it.each`
      input
      ${"3.14"}
      ${"0.5"}
      ${".5"}
      ${"0.1_000"}
      ${"1_000.1"}
    `("recognizes decimal numerals, like $input", ({ input }) => {
      const lexer = new Lexer(input);
      expect(lexer.nextToken()).toEqual(
        new Token(Literal.Number, anyLocation, input)
      );
    });

    it.each`
      input
      ${"0123"}
      ${"1__2"}
      ${"1."}
      ${"1..2"}
      ${"1.2.3"}
    `("throws IllegalSymbolError for invalid numerals", ({ input }) => {
      const lexer = new Lexer(input);
      expect(() => lexer.nextToken()).toThrow(IllegalSymbolError);
    });
  });

  describe("arithmetic operators", () => {
    it.each`
      operator | tokenType
      ${"+"}   | ${Operator.Plus}
      ${"-"}   | ${Operator.Minus}
      ${"*"}   | ${Operator.Multiply}
      ${"/"}   | ${Operator.Divide}
      ${"**"}  | ${Operator.Power}
    `("recognizes $operator operator", ({ operator, tokenType }) => {
      const lexer = new Lexer(operator);
      expect(lexer.nextToken()).toEqual(new Token(tokenType, anyLocation));
    });
  });

  it("recognizes a simple expression", () => {
    const lexer = new Lexer("1+2");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(4);
    expect(tokens).toEqual([
      new Token(Literal.Number, anyLocation, "1"),
      new Token(Operator.Plus, anyLocation),
      new Token(Literal.Number, anyLocation, "2"),
      new Token(Delimiter.End, anyLocation),
    ]);
  });

  it("recognizes left and right brackets", () => {
    const lexer = new Lexer("()");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(3);
    expect(tokens).toEqual([
      new Token(Delimiter.LeftBracket, anyLocation),
      new Token(Delimiter.RightBracket, anyLocation),
      new Token(Delimiter.End, anyLocation),
    ]);
  });

  it("recognizes left and right braces", () => {
    const lexer = new Lexer("{}");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(3);
    expect(tokens).toEqual([
      new Token(Delimiter.LeftBrace, anyLocation),
      new Token(Delimiter.RightBrace, anyLocation),
      new Token(Delimiter.End, anyLocation),
    ]);
  });

  describe("identifiers", () => {
    it.each`
      input
      ${"x"}
      ${"someVar"}
      ${"test123"}
    `("recognizes a valid identifier, like $input", ({ input }) => {
      const lexer = new Lexer(`${input} = 123`);
      const tokens = [...lexer.tokenize()];

      expect(tokens.length).toBe(4);
      expect(tokens[0]).toEqual(
        new Token(Literal.Identifier, anyLocation, input)
      );
      expect(tokens[1]).toEqual(new Token(Operator.Assigment, anyLocation));
    });

    it("recognizes assignments", () => {
      const lexer = new Lexer("someVar = 123");
      const tokens = [...lexer.tokenize()];

      expect(tokens.length).toBe(4);
      expect(tokens).toEqual([
        new Token(Literal.Identifier, anyLocation, "someVar"),
        new Token(Operator.Assigment, anyLocation),
        new Token(Literal.Number, anyLocation, "123"),
        new Token(Delimiter.End, anyLocation),
      ]);
    });
  });

  it("recognizes function declaration", () => {
    const lexer = new Lexer("function add() { return 1 + 2 }");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(11);
    expect(tokens).toEqual([
      new Token(Keyword.Function, anyLocation),
      new Token(Literal.Identifier, anyLocation, "add"),
      new Token(Delimiter.LeftBracket, anyLocation),
      new Token(Delimiter.RightBracket, anyLocation),
      new Token(Delimiter.LeftBrace, anyLocation),
      new Token(Keyword.Return, anyLocation),
      new Token(Literal.Number, anyLocation, "1"),
      new Token(Operator.Plus, anyLocation),
      new Token(Literal.Number, anyLocation, "2"),
      new Token(Delimiter.RightBrace, anyLocation),
      new Token(Delimiter.End, anyLocation),
    ]);
  });

  it("throws IllegalSymbolError when unexpected symbol is given", () => {
    const lexer = new Lexer("1 @");
    expect(() => [...lexer.tokenize()]).toThrow(new IllegalSymbolError("@", 2));
  });

  it("sets valid locations for tokens", () => {
    const lexer = new Lexer("foo\n123 ** 4\n\nbar");

    let token = lexer.nextToken();
    expect(token.value).toBe("foo");
    expect(token.location).toEqual<Location>({
      position: 0,
      line: 0,
      column: 0,
    });

    token = lexer.nextToken();
    expect(token.type).toBe(Delimiter.NewLine);
    expect(token.location).toEqual<Location>({
      position: 3,
      line: 0,
      column: 3,
    });

    token = lexer.nextToken();
    expect(token.type).toBe(Literal.Number);
    expect(token.value).toBe("123");
    expect(token.location).toEqual<Location>({
      position: 4,
      line: 1,
      column: 0,
    });

    token = lexer.nextToken();
    expect(token.type).toBe(Operator.Power);
    expect(token.location).toEqual<Location>({
      position: 8,
      line: 1,
      column: 4,
    });

    token = lexer.nextToken();
    expect(token.type).toBe(Literal.Number);
    expect(token.value).toBe("4");
    expect(token.location).toEqual<Location>({
      position: 11,
      line: 1,
      column: 7,
    });

    lexer.nextToken();
    lexer.nextToken();

    token = lexer.nextToken();
    expect(token.type).toBe(Literal.Identifier);
    expect(token.value).toBe("bar");
    expect(token.location).toEqual<Location>({
      position: 14,
      line: 3,
      column: 0,
    });

    token = lexer.nextToken();
    expect(token.type).toBe(Delimiter.End);
    expect(token.location).toEqual<Location>({
      position: 17,
      line: 3,
      column: 3,
    });
  });
});
