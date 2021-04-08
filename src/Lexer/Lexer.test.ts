import { SyntaxError } from "./errors";
import { Lexer } from "./Lexer";
import { Token, TokenType } from "./Token";

describe("Lexer", () => {
  it("tokenizes an empty input", () => {
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
        new Token(TokenType.NumberLiteral, input, 0)
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
        new Token(TokenType.NumberLiteral, input, 0)
      );
    });

    it.each`
      input
      ${"0123"}
      ${"1__2"}
      ${"1."}
      ${"1..2"}
      ${"1.2.3"}
    `("throws SyntaxError for invalid numerals", ({ input }) => {
      const lexer = new Lexer(input);
      expect(() => lexer.nextToken()).toThrow(SyntaxError);
    });
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

  it("recognizes a simple expression", () => {
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

  it("recognizes left and right braces", () => {
    const lexer = new Lexer("{}");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(3);
    expect(tokens).toEqual([
      new Token(TokenType.LeftBrace, "{", 0),
      new Token(TokenType.RightBrace, "}", 1),
      new Token(TokenType.End, "", 2),
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
      expect(tokens[0]).toEqual(new Token(TokenType.Identifier, input, 0));
      expect(tokens[1]).toEqual(
        new Token(TokenType.Assigment, "=", input.length + 1)
      );
    });

    it("recognizes assignments", () => {
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
  });

  it("recognizes function declaration", () => {
    const lexer = new Lexer("function add() { return 1 + 2 }");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(11);
    expect(tokens).toEqual([
      new Token(TokenType.Function, "function", 0),
      new Token(TokenType.Identifier, "add", 9),
      new Token(TokenType.LeftBracket, "(", 12),
      new Token(TokenType.RightBracket, ")", 13),
      new Token(TokenType.LeftBrace, "{", 15),
      new Token(TokenType.Return, "return", 17),
      new Token(TokenType.NumberLiteral, "1", 24),
      new Token(TokenType.Plus, "+", 26),
      new Token(TokenType.NumberLiteral, "2", 28),
      new Token(TokenType.RightBrace, "}", 30),
      new Token(TokenType.End, "", 31),
    ]);
  });

  it("throws SyntaxError when unexpected symbol is given", () => {
    const lexer = new Lexer("1 ###");
    expect(() => [...lexer.tokenize()]).toThrow(new SyntaxError("#", 2));
  });
});
