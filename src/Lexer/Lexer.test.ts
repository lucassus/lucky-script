import { IllegalSymbolError } from "./errors";
import { Lexer } from "./Lexer";
import { Delimiter, Keyword, Literal, Operator, Token } from "./Token";

describe("Lexer", () => {
  it("tokenizes an empty input", () => {
    const lexer = new Lexer("");
    expect(lexer.nextToken()).toEqual(new Token(Delimiter.End, 0));
  });

  describe("statements separators", () => {
    it("tokenizes new lines", () => {
      const lexer = new Lexer("\n1\n2\n\n");
      const tokens = [...lexer.tokenize()];

      expect(tokens.length).toBe(7);
      expect(tokens).toEqual([
        new Token(Delimiter.NewLine, 0),
        new Token(Literal.Number, 1, "1"),
        new Token(Delimiter.NewLine, 2),
        new Token(Literal.Number, 3, "2"),
        new Token(Delimiter.NewLine, 4),
        new Token(Delimiter.NewLine, 5),
        new Token(Delimiter.End, 6),
      ]);
    });

    it("tokenizes semicolons", () => {
      const lexer = new Lexer(";");
      const tokens = [...lexer.tokenize()];

      expect(tokens.length).toBe(2);
      expect(tokens).toEqual([
        new Token(Delimiter.NewLine, 0),
        new Token(Delimiter.End, 1),
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
      new Token(Literal.Number, expect.any(Number), "1"),
      new Token(Operator.Plus, expect.any(Number), "+"),
      new Token(Literal.Number, expect.any(Number), "2"),
      new Token(Delimiter.End, expect.any(Number)),
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
      new Token(Delimiter.NewLine, expect.any(Number)),
      new Token(Literal.Identifier, expect.any(Number), "first"),
      new Token(Delimiter.NewLine, expect.any(Number)),
      new Token(Literal.Identifier, expect.any(Number), "second"),
      new Token(Delimiter.NewLine, expect.any(Number)),
      new Token(Delimiter.End, expect.any(Number)),
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
      expect(lexer.nextToken()).toEqual(new Token(Literal.Number, 0, input));
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
      expect(lexer.nextToken()).toEqual(new Token(Literal.Number, 0, input));
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
      expect(lexer.nextToken()).toEqual(new Token(tokenType, 0, operator));
    });
  });

  it("recognizes a simple expression", () => {
    const lexer = new Lexer("1+2");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(4);
    expect(tokens).toEqual([
      new Token(Literal.Number, 0, "1"),
      new Token(Operator.Plus, 1, "+"),
      new Token(Literal.Number, 2, "2"),
      new Token(Delimiter.End, 3),
    ]);
  });

  it("recognizes left and right brackets", () => {
    const lexer = new Lexer("()");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(3);
    expect(tokens).toEqual([
      new Token(Delimiter.LeftBracket, 0),
      new Token(Delimiter.RightBracket, 1),
      new Token(Delimiter.End, 2),
    ]);
  });

  it("recognizes left and right braces", () => {
    const lexer = new Lexer("{}");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(3);
    expect(tokens).toEqual([
      new Token(Delimiter.LeftBrace, 0),
      new Token(Delimiter.RightBrace, 1),
      new Token(Delimiter.End, 2),
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
      expect(tokens[0]).toEqual(new Token(Literal.Identifier, 0, input));
      expect(tokens[1]).toEqual(
        new Token(Operator.Assigment, input.length + 1)
      );
    });

    it("recognizes assignments", () => {
      const lexer = new Lexer("someVar = 123");
      const tokens = [...lexer.tokenize()];

      expect(tokens.length).toBe(4);
      expect(tokens).toEqual([
        new Token(Literal.Identifier, 0, "someVar"),
        new Token(Operator.Assigment, 8),
        new Token(Literal.Number, 10, "123"),
        new Token(Delimiter.End, 13),
      ]);
    });
  });

  it("recognizes function declaration", () => {
    const lexer = new Lexer("function add() { return 1 + 2 }");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(11);
    expect(tokens).toEqual([
      new Token(Keyword.Function, 0),
      new Token(Literal.Identifier, 9, "add"),
      new Token(Delimiter.LeftBracket, 12),
      new Token(Delimiter.RightBracket, 13),
      new Token(Delimiter.LeftBrace, 15),
      new Token(Keyword.Return, 17),
      new Token(Literal.Number, 24, "1"),
      new Token(Operator.Plus, 26, "+"),
      new Token(Literal.Number, 28, "2"),
      new Token(Delimiter.RightBrace, 30),
      new Token(Delimiter.End, 31),
    ]);
  });

  it("throws IllegalSymbolError when unexpected symbol is given", () => {
    const lexer = new Lexer("1 @");
    expect(() => [...lexer.tokenize()]).toThrow(new IllegalSymbolError("@", 2));
  });
});
