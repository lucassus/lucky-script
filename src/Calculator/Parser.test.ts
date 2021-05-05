import { BinaryOperation, NumberLiteral, UnaryOperation } from "./Ast";
import { Parser } from "./Parser";
import { Tokenizer } from "./Tokenizer";

describe("Parser", () => {
  it("generates a valid AST", () => {
    const tokens = new Tokenizer("(1 + 2) * 3 - -4 ** 5").tokenize();
    const ast = new Parser(tokens).parse();

    expect(ast).toEqual(
      new BinaryOperation(
        new BinaryOperation(
          new BinaryOperation(new NumberLiteral(1), "+", new NumberLiteral(2)),
          "*",
          new NumberLiteral(3)
        ),
        "-",
        new UnaryOperation(
          "-",
          new BinaryOperation(new NumberLiteral(4), "**", new NumberLiteral(5))
        )
      )
    );
  });

  it("has nice errors reporting", () => {
    const tokens = new Tokenizer("(1 + 2 *").tokenize();

    expect(() => new Parser(tokens).parse()).toThrow(
      "Unexpected token eof at position 5."
    );
  });

  it("has nice errors reporting", () => {
    const tokens = new Tokenizer("** **").tokenize();

    expect(() => new Parser(tokens).parse()).toThrow(
      "Unexpected token ** at position 0."
    );
  });
});
