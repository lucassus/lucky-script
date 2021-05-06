import { IllegalTokenError } from "./errors";
import {
  BinaryOperation,
  NumberLiteral,
  UnaryOperation,
  VariableAccess,
} from "./Expression";
import { Parser } from "./Parser";
import { Tokenizer } from "./Tokenizer";

describe("Parser", () => {
  it("generates a valid AST", () => {
    const tokens = new Tokenizer("(1.5 + 2) * 3 - -foo ** 5").tokenize();
    const expression = new Parser(tokens).parse();

    expect(expression).toEqual(
      new BinaryOperation(
        new BinaryOperation(
          new BinaryOperation(
            new NumberLiteral(1.5),
            "+",
            new NumberLiteral(2)
          ),
          "*",
          new NumberLiteral(3)
        ),
        "-",
        new UnaryOperation(
          "-",
          new BinaryOperation(
            new VariableAccess("foo"),
            "**",
            new NumberLiteral(5)
          )
        )
      )
    );
  });

  it.each`
    input         | error
    ${"(1 + 2 *"} | ${"Unexpected 'eof' at position 8"}
    ${"** **"}    | ${"Unexpected '**' at position 0"}
    ${"1 2"}      | ${"Expected 'eof' but got 'number' at position 2"}
  `(
    "throws error when the given input has invalid syntax",
    ({ input, error }) => {
      const tokens = new Tokenizer(input).tokenize();

      expect(() => new Parser(tokens).parse()).toThrow(IllegalTokenError);
      expect(() => new Parser(tokens).parse()).toThrow(error);
    }
  );
});
