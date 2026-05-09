import { describe, expect, it } from "vitest";

import { IllegalSymbolError } from "./errors";
import { Lexer } from "./Lexer";
import type { Location } from "./Token";
import { Delimiter, Keyword, Literal, Operator, Token } from "./Token";

const anyLocation = expect.objectContaining<Location>({
  position: expect.any(Number),
  line: expect.any(Number),
  column: expect.any(Number),
});

describe("Lexer", () => {
  it("tokenizes an empty input", () => {
    const lexer = new Lexer("");

    expect(lexer.nextToken()).toEqual(new Token(Delimiter.Eof, anyLocation));
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
        new Token(Delimiter.Eof, anyLocation),
      ]);
    });

    it("tokenizes semicolons", () => {
      const lexer = new Lexer(";");
      const tokens = [...lexer.tokenize()];

      expect(tokens.length).toBe(2);
      expect(tokens).toEqual([
        new Token(Delimiter.NewLine, anyLocation),
        new Token(Delimiter.Eof, anyLocation),
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
      new Token(Delimiter.Eof, anyLocation),
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
      new Token(Delimiter.Eof, anyLocation),
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
        new Token(Literal.Number, anyLocation, input),
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
        new Token(Literal.Number, anyLocation, input),
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

  it("throws IllegalSymbolError for '!' not followed by '='", () => {
    expect(() => new Lexer("!5").nextToken()).toThrow(IllegalSymbolError);
  });

  it("throws IllegalSymbolError for invalid escape sequence in string", () => {
    expect(() => [...new Lexer('"\\q"').tokenize()]).toThrow(
      IllegalSymbolError,
    );
  });

  it.each`
    operator | tokenType
    ${"+"}   | ${Operator.Plus}
    ${"-"}   | ${Operator.Minus}
    ${"*"}   | ${Operator.Multiply}
    ${"/"}   | ${Operator.Divide}
    ${"**"}  | ${Operator.Power}
    ${"<"}   | ${Operator.Lt}
    ${"<="}  | ${Operator.Lte}
    ${"="}   | ${Operator.Assigment}
    ${"=="}  | ${Operator.Eq}
    ${">"}   | ${Operator.Gt}
    ${">="}  | ${Operator.Gte}
    ${"+="}  | ${Operator.PlusAssign}
    ${"-="}  | ${Operator.MinusAssign}
    ${"*="}  | ${Operator.MultiplyAssign}
    ${"/="}  | ${Operator.DivideAssign}
  `("recognizes operator $operator", ({ operator, tokenType }) => {
    const lexer = new Lexer(operator);

    expect(lexer.nextToken()).toEqual(
      new Token(tokenType, {
        position: 0,
        line: 0,
        column: 0,
      }),
    );
  });

  it("recognizes a simple expression", () => {
    const lexer = new Lexer("1+2");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(4);
    expect(tokens).toEqual([
      new Token(Literal.Number, anyLocation, "1"),
      new Token(Operator.Plus, anyLocation),
      new Token(Literal.Number, anyLocation, "2"),
      new Token(Delimiter.Eof, anyLocation),
    ]);
  });

  it("recognizes left and right brackets", () => {
    const lexer = new Lexer("()");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(3);
    expect(tokens).toEqual([
      new Token(Delimiter.LeftBracket, anyLocation),
      new Token(Delimiter.RightBracket, anyLocation),
      new Token(Delimiter.Eof, anyLocation),
    ]);
  });

  it("throws IllegalSymbolError for braces", () => {
    expect(() => [...new Lexer("{}").tokenize()]).toThrow(IllegalSymbolError);
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
        new Token(Literal.Identifier, anyLocation, input),
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
        new Token(Delimiter.Eof, anyLocation),
      ]);
    });

    it("tokenizes 'function' as an identifier", () => {
      const lexer = new Lexer("function");
      const tokens = [...lexer.tokenize()];

      expect(tokens).toEqual([
        new Token(Literal.Identifier, anyLocation, "function"),
        new Token(Delimiter.Eof, anyLocation),
      ]);
    });
  });

  it("recognizes fun declaration", () => {
    const lexer = new Lexer("fun add()\n  return 1 + 2\nend");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(12);
    expect(tokens).toEqual([
      new Token(Keyword.Fun, anyLocation),
      new Token(Literal.Identifier, anyLocation, "add"),
      new Token(Delimiter.LeftBracket, anyLocation),
      new Token(Delimiter.RightBracket, anyLocation),
      new Token(Delimiter.NewLine, anyLocation),
      new Token(Keyword.Return, anyLocation),
      new Token(Literal.Number, anyLocation, "1"),
      new Token(Operator.Plus, anyLocation),
      new Token(Literal.Number, anyLocation, "2"),
      new Token(Delimiter.NewLine, anyLocation),
      new Token(Keyword.End, anyLocation),
      new Token(Delimiter.Eof, anyLocation),
    ]);
  });

  it("recognizes the nothing keyword", () => {
    const lexer = new Lexer("nothing");
    const tokens = [...lexer.tokenize()];

    expect(tokens).toEqual([
      new Token(Keyword.Nothing, anyLocation),
      new Token(Delimiter.Eof, anyLocation),
    ]);
  });

  it("recognizes if expression", () => {
    const lexer = new Lexer("if x < 1\n  return 123\nend");
    const tokens = [...lexer.tokenize()];

    expect(tokens.length).toBe(10);
    expect(tokens).toEqual([
      new Token(Keyword.If, anyLocation),
      new Token(Literal.Identifier, anyLocation, "x"),
      new Token(Operator.Lt, anyLocation),
      new Token(Literal.Number, anyLocation, "1"),
      new Token(Delimiter.NewLine, anyLocation),
      new Token(Keyword.Return, anyLocation),
      new Token(Literal.Number, anyLocation, "123"),
      new Token(Delimiter.NewLine, anyLocation),
      new Token(Keyword.End, anyLocation),
      new Token(Delimiter.Eof, anyLocation),
    ]);
  });

  it.each`
    input         | keyword
    ${"true"}     | ${Keyword.True}
    ${"false"}    | ${Keyword.False}
    ${"and"}      | ${Keyword.And}
    ${"or"}       | ${Keyword.Or}
    ${"not"}      | ${Keyword.Not}
    ${"local"}    | ${Keyword.Local}
    ${"outer"}    | ${Keyword.Outer}
    ${"while"}    | ${Keyword.While}
    ${"break"}    | ${Keyword.Break}
    ${"continue"} | ${Keyword.Continue}
    ${"fun"}      | ${Keyword.Fun}
    ${"end"}      | ${Keyword.End}
    ${"then"}     | ${Keyword.Then}
    ${"elseif"}   | ${Keyword.ElseIf}
    ${"in"}       | ${Keyword.In}
  `("tokenizes '$input' as a keyword", ({ input, keyword }) => {
    const tokens = [...new Lexer(input).tokenize()];
    expect(tokens[0]).toEqual(new Token(keyword, anyLocation));
  });

  it("tokenizes local assignment", () => {
    const lexer = new Lexer("local x = 1");
    const tokens = [...lexer.tokenize()];

    expect(tokens).toEqual([
      new Token(Keyword.Local, anyLocation),
      new Token(Literal.Identifier, anyLocation, "x"),
      new Token(Operator.Assigment, anyLocation),
      new Token(Literal.Number, anyLocation, "1"),
      new Token(Delimiter.Eof, anyLocation),
    ]);
  });

  it("tokenizes outer assignment", () => {
    const lexer = new Lexer("outer x = 1");
    const tokens = [...lexer.tokenize()];

    expect(tokens).toEqual([
      new Token(Keyword.Outer, anyLocation),
      new Token(Literal.Identifier, anyLocation, "x"),
      new Token(Operator.Assigment, anyLocation),
      new Token(Literal.Number, anyLocation, "1"),
      new Token(Delimiter.Eof, anyLocation),
    ]);
  });

  describe("string literals", () => {
    it.each`
      input        | expectedValue
      ${'"hello"'} | ${'"hello"'}
      ${'""'}      | ${'""'}
      ${'"a b c"'} | ${'"a b c"'}
    `(
      "tokenizes $input as Literal.String with raw value",
      ({ input, expectedValue }) => {
        const lexer = new Lexer(input);
        expect(lexer.nextToken()).toEqual(
          new Token(Literal.String, anyLocation, expectedValue),
        );
      },
    );

    it("preserves escape sequences raw in token value", () => {
      const lexer = new Lexer('"say \\"hi\\""');
      expect(lexer.nextToken()).toEqual(
        new Token(Literal.String, anyLocation, '"say \\"hi\\""'),
      );
    });

    it("preserves backslash escape raw in token value", () => {
      const lexer = new Lexer('"back\\\\slash"');
      expect(lexer.nextToken()).toEqual(
        new Token(Literal.String, anyLocation, '"back\\\\slash"'),
      );
    });

    it("throws IllegalSymbolError for unterminated string", () => {
      const lexer = new Lexer('"hello');
      expect(() => lexer.nextToken()).toThrow(IllegalSymbolError);
    });
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
    expect(token.type).toBe(Delimiter.Eof);
    expect(token.location).toEqual<Location>({
      position: 17,
      line: 3,
      column: 3,
    });
  });
});
