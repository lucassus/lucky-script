import { parse } from "../testingUtils";
import {
  BinaryOperation,
  Block,
  FunctionCall,
  FunctionDeclaration,
  Numeral,
  Program,
  UnaryOperation,
  VariableAccess,
  VariableAssigment,
} from "./AstNode";

describe("Parser", () => {
  it("parses empty input", () => {
    const ast = parse("");

    expect(ast).toEqual(new Program(new Block([])));
  });

  it("parses simple addition", () => {
    const ast = parse("1 + 2");

    expect(ast).toEqual(
      new Program(
        new Block([
          new BinaryOperation(new Numeral("1"), "+", new Numeral("2")),
        ])
      )
    );
  });

  it("parses arithmetic expressions with left associativity", () => {
    const ast = parse("1 + 2 - 3");

    expect(ast).toEqual(
      new Program(
        new Block([
          new BinaryOperation(
            new BinaryOperation(new Numeral("1"), "+", new Numeral("2")),
            "-",
            new Numeral("3")
          ),
        ])
      )
    );
  });

  it("parses arithmetic expressions with correct operators precedence", () => {
    const ast = parse("24 / 3 - 2.5 * 2 ** 3");

    expect(ast).toEqual(
      new Program(
        new Block([
          new BinaryOperation(
            new BinaryOperation(new Numeral("24"), "/", new Numeral("3")),
            "-",
            new BinaryOperation(
              new Numeral("2.5"),
              "*",
              new BinaryOperation(new Numeral("2"), "**", new Numeral("3"))
            )
          ),
        ])
      )
    );
  });

  it("parses pow operator and unary - with the correct precedence", () => {
    const ast = parse("-2 ** 3");

    expect(ast).toEqual(
      new Program(
        new Block([
          new UnaryOperation(
            "-",
            new BinaryOperation(new Numeral("2"), "**", new Numeral("3"))
          ),
        ])
      )
    );
  });

  it("parses parenthesized arithmetic expressions", () => {
    const ast = parse("(1 + 2) * 3");

    expect(ast).toEqual(
      new Program(
        new Block([
          new BinaryOperation(
            new BinaryOperation(new Numeral("1"), "+", new Numeral("2")),
            "*",
            new Numeral("3")
          ),
        ])
      )
    );
  });

  it("raises an error when the matching bracket is not found", () => {
    expect(() => parse("(1 + 2")).toThrow("Expecting ) but got EndOfInput");

    expect(() => parse(")")).toThrow("Unexpected token )");
  });

  it.each`
    input       | operator
    ${"1 + +2"} | ${"+"}
    ${"1 + -2"} | ${"-"}
  `(
    "parses unary arithmetic expressions, like $input",
    ({ input, operator }) => {
      const ast = parse(input);

      expect(ast).toEqual(
        new Program(
          new Block([
            new BinaryOperation(
              new Numeral("1"),
              "+",
              new UnaryOperation(operator, new Numeral("2"))
            ),
          ])
        )
      );
    }
  );

  describe("variable assignments", () => {
    it("parses simple variable assignments", () => {
      const ast = parse("pi = 3.14");

      expect(ast).toEqual(
        new Program(
          new Block([new VariableAssigment("pi", new Numeral("3.14"))])
        )
      );
    });

    it("parses expressions assignments", () => {
      const ast = parse("someVar123 = (1 + 2) * 3");

      expect(ast).toEqual(
        new Program(
          new Block([
            new VariableAssigment(
              "someVar123",
              new BinaryOperation(
                new BinaryOperation(new Numeral("1"), "+", new Numeral("2")),
                "*",
                new Numeral("3")
              )
            ),
          ])
        )
      );
    });

    it("parses a chain of assignments", () => {
      const ast = parse("x = y = z = 3");

      expect(ast).toEqual(
        new Program(
          new Block([
            new VariableAssigment(
              "x",
              new VariableAssigment(
                "y",
                new VariableAssigment("z", new Numeral("3"))
              )
            ),
          ])
        )
      );
    });

    it("parses variable access", () => {
      const ast = parse("x + 3");

      expect(ast).toEqual(
        new Program(
          new Block([
            new BinaryOperation(new VariableAccess("x"), "+", new Numeral("3")),
          ])
        )
      );
    });

    it("raises errors for invalid assignments", () => {
      expect(() => parse("x_")).toThrow(
        new SyntaxError("Unrecognized symbol '_' at position 1")
      );

      expect(() => parse("x = ")).toThrow(
        new SyntaxError("Unexpected token EndOfInput")
      );
    });
  });

  it("parses a script with several lines of code", () => {
    const ast = parse(`
    
    x = 1
    y = 2
    
    x + y * 3
    
    `);

    expect(ast).toEqual(
      new Program(
        new Block([
          new VariableAssigment("x", new Numeral("1")),
          new VariableAssigment("y", new Numeral("2")),
          new BinaryOperation(
            new VariableAccess("x"),
            "+",
            new BinaryOperation(new VariableAccess("y"), "*", new Numeral("3"))
          ),
        ])
      )
    );
  });

  it("ignores line comments", () => {
    const ast = parse(`
    1 + 2 # This is a simple addition
    `);

    expect(ast).toEqual(
      new Program(
        new Block([
          new BinaryOperation(new Numeral("1"), "+", new Numeral("2")),
        ])
      )
    );
  });

  describe("function declaration", () => {
    it("parses a declaration without arguments", () => {
      const ast = parse("function add() {\n\t1 + 2\n}");

      expect(ast).toEqual(
        new Program(
          new Block([
            new FunctionDeclaration(
              "add",
              new Block([
                new BinaryOperation(new Numeral("1"), "+", new Numeral("2")),
              ])
            ),
          ])
        )
      );
    });

    it("can't parse declaration assigment to a variable", () => {
      expect(() => parse("x = function abc() {}")).toThrow(
        "Unexpected token function"
      );
    });
  });

  describe("function call", () => {
    it("parses a call without arguments", () => {
      const ast = parse("doSomething()");

      expect(ast).toEqual(
        new Program(new Block([new FunctionCall("doSomething")]))
      );
    });

    it("parses assigment of a call result to a variable", () => {
      const ast = parse("x = abc()");

      expect(ast).toEqual(
        new Program(
          new Block([new VariableAssigment("x", new FunctionCall("abc"))])
        )
      );
    });

    it("parses calls with the correct priority", () => {
      const ast = parse("foo() + -bar() ** baz()");

      expect(ast).toEqual(
        new Program(
          new Block([
            new BinaryOperation(
              new FunctionCall("foo"),
              "+",
              new UnaryOperation(
                "-",
                new BinaryOperation(
                  new FunctionCall("bar"),
                  "**",
                  new FunctionCall("baz")
                )
              )
            ),
          ])
        )
      );
    });
  });
});
