import { Token } from "./Token";
import { Tokenizer } from "./Tokenizer";

describe("Tokenizer", () => {
  it("tokenizes the expression", () => {
    const tokens = new Tokenizer("(1 + 12) / fooBar ** 12.34").tokenize();

    expect(tokens).toEqual([
      new Token(0, "("),
      new Token(1, "number", 1),
      new Token(3, "+"),
      new Token(5, "number", 12),
      new Token(7, ")"),
      new Token(9, "/"),
      new Token(11, "identifier", "fooBar"),
      new Token(18, "**"),
      new Token(21, "number", 12.34),
      new Token(26, "eof"),
    ]);
  });

  it("raises error on unrecognized character", () => {
    expect(() => new Tokenizer("123 % 123").tokenize()).toThrow(
      "Unrecognized character '%' at 4"
    );
  });
});
