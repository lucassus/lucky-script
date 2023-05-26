import { Token } from "./Token";
import { Tokenizer } from "./Tokenizer";

describe("Tokenizer", () => {
  it("tokenizes the expression", () => {
    const tokens = new Tokenizer("(1 + 12) / fooBar ** 12.34").tokenize();

    expect(tokens).toEqual([
      new Token("(", 0),
      new Token("number", 1, 1),
      new Token("+", 3),
      new Token("number", 5, 12),
      new Token(")", 7),
      new Token("/", 9),
      new Token("identifier", 11, "fooBar"),
      new Token("**", 18),
      new Token("number", 21, 12.34),
      new Token("eof", 26),
    ]);
  });

  it("raises error on unrecognized character", () => {
    expect(() => new Tokenizer("123 % 123").tokenize()).toThrow(
      "Unrecognized character '%' at 4"
    );
  });
});
