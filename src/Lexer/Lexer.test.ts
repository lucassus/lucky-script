import { SyntaxError } from "./errors";
import { Lexer } from "./Lexer";
import { Token, TokenType } from "./Token";

describe("Lexer", () => {
  it("tokenizes empty input", () => {
    const lexer = new Lexer("");
    expect(lexer.nextToken()).toEqual(new Token(TokenType.End, "", 0));
  });

  describe("new line separators", () => {
    it("tokenizes \\n", () => {
      const lexer = new Lexer("\n1\n2\n\n");

      const tokens = [...lexer.tokenize()];
      expect(tokens.length).toBe(7);
      expect(tokens).toEqual([
        new Token(TokenType.NewLine, "\n", 0),
        new Token(TokenType.NumberLiteral, "1", 1),
        new Token(TokenType.NewLine, "\n", 2),
        new Token(TokenType.NumberLiteral, "2", 3),
        new Token(TokenType.NewLine, "\n", 4),
        new Token(TokenType.NewLine, "\n", 5),
        new Token(TokenType.End, "", 6),
      ]);
    });

    it("tokenizes ;", () => {
      const lexer = new Lexer(";");
      const tokens = [...lexer.tokenize()];

      expect(tokens.length).toBe(2);
      expect(tokens).toEqual([
        new Token(TokenType.NewLine, ";", 0),
        new Token(TokenType.End, "", 1),
      ]);
    });
  });

  describe("number literals", () => {
    it.each`
      input
      ${"0"}
      ${"41"}
      ${"1000"}
      ${"1_000"}
    `("recognizes integer numeral, like $input", ({ input }) => {
      const lexer = new Lexer(input);
      expect(lexer.nextToken()).toEqual(
        new Token(TokenType.NumberLiteral, input, 0)
      );
    });

    it.each`
      input
      ${"3.14"}
      ${"0.5"}
      ${".5"}
      ${"0.1_000"}
    `("recognizes decimal numerals, like $input", ({ input }) => {
      const lexer = new Lexer(input);
      expect(lexer.nextToken()).toEqual(
        new Token(TokenType.NumberLiteral, input, 0)
      );
    });

    it.each`
      input
      ${"0123"}
      ${"1__2"}
      ${"1."}
      ${"1.2.3"}
    `("throws SyntaxError for invalid numerals", ({ input }) => {
      const lexer = new Lexer(input);
      expect(() => lexer.nextToken()).toThrow(SyntaxError);
    });
  });

  it("ignores whitespaces", () => {
    const lexer = new Lexer("  1 +\t2  ");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(4);
    expect(tokens).toEqual([
      new Token(TokenType.NumberLiteral, "1", 2),
      new Token(TokenType.Plus, "+", 4),
      new Token(TokenType.NumberLiteral, "2", 6),
      new Token(TokenType.End, "", 9),
    ]);
  });

  describe("arithmetic operators", () => {
    it.each`
      operator | tokenType
      ${"+"}   | ${TokenType.Plus}
      ${"-"}   | ${TokenType.Minus}
      ${"*"}   | ${TokenType.Multiply}
      ${"/"}   | ${TokenType.Divide}
      ${"**"}  | ${TokenType.Power}
    `("recognizes $operator operator", ({ operator, tokenType }) => {
      const lexer = new Lexer(operator);
      expect(lexer.nextToken()).toEqual(new Token(tokenType, operator, 0));
    });
  });

  it("recognizes a simple expressions", () => {
    const lexer = new Lexer("1+2");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(4);
    expect(tokens).toEqual([
      new Token(TokenType.NumberLiteral, "1", 0),
      new Token(TokenType.Plus, "+", 1),
      new Token(TokenType.NumberLiteral, "2", 2),
      new Token(TokenType.End, "", 3),
    ]);
  });

  it("recognizes left and right brackets", () => {
    const lexer = new Lexer("()");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(3);
    expect(tokens).toEqual([
      new Token(TokenType.LeftBracket, "(", 0),
      new Token(TokenType.RightBracket, ")", 1),
      new Token(TokenType.End, "", 2),
    ]);
  });

  it("recognizes identifiers and assignments", () => {
    const lexer = new Lexer("someVar = 123");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(4);
    expect(tokens).toEqual([
      new Token(TokenType.Identifier, "someVar", 0),
      new Token(TokenType.Assigment, "=", 8),
      new Token(TokenType.NumberLiteral, "123", 10),
      new Token(TokenType.End, "", 13),
    ]);
  });

  it("recognizes functions", () => {
    const lexer = new Lexer("function add() { 1 + 2 }");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(10);
    expect(tokens).toEqual([
      new Token(TokenType.Function, "function", 0),
      new Token(TokenType.Identifier, "add", 9),
      new Token(TokenType.LeftBracket, "(", 12),
      new Token(TokenType.RightBracket, ")", 13),
      new Token(TokenType.LeftBrace, "{", 15),
      new Token(TokenType.NumberLiteral, "1", 17),
      new Token(TokenType.Plus, "+", 19),
      new Token(TokenType.NumberLiteral, "2", 21),
      new Token(TokenType.RightBrace, "}", 23),
      new Token(TokenType.End, "", 24),
    ]);
  });

  it("throws SyntaxError when unexpected symbol is given", () => {
    const lexer = new Lexer("1 ###");
    expect(() => [...lexer.tokenize()]).toThrow(new SyntaxError("#", 2));
  });
});
