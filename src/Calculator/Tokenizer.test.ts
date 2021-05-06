import { Token } from "./Token";
import { Tokenizer } from "./Tokenizer";

describe("Tokenizer", () => {
  it("tokenizes the expression", () => {
    const tokens = new Tokenizer("(1 + 12) * foo ** 1234").tokenize();

    expect(tokens).toEqual([
      new Token(0, "("),
      new Token(1, "number", 1),
      new Token(3, "+"),
      new Token(5, "number", 12),
      new Token(7, ")"),
      new Token(9, "*"),
      new Token(11, "identifier", "foo"),
      new Token(15, "**"),
      new Token(18, "number", 1234),
      new Token(22, "eof"),
    ]);
  });
});
