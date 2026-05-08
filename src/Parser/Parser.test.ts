import { describe, expect, it } from "vitest";

import { IllegalSymbolError } from "../Lexer";
import { parse } from "../testingUtils";
import {
  BinaryOperation,
  BooleanLiteral,
  BreakStatement,
  ContinueStatement,
  FunctionCall,
  FunctionDeclaration,
  IfStatement,
  NothingLiteral,
  Numeral,
  Program,
  ReturnStatement,
  StringLiteral,
  UnaryOperation,
  VariableAccess,
  VariableAssigment,
  WhileStatement,
} from "./AstNode";
import { SyntaxError } from "./errors";

describe("Parser", () => {
  it("parses empty input", () => {
    const ast = parse("");

    expect(ast).toEqual(new Program([]));
  });

  it("parses simple addition", () => {
    const ast = parse("1 + 2");

    expect(ast).toEqual(
      new Program([
        new BinaryOperation(new Numeral("1"), "+", new Numeral("2")),
      ]),
    );
  });

  it("parses arithmetic expressions with left associativity", () => {
    const ast = parse("1 + 2 - 3");

    expect(ast).toEqual(
      new Program([
        new BinaryOperation(
          new BinaryOperation(new Numeral("1"), "+", new Numeral("2")),
          "-",
          new Numeral("3"),
        ),
      ]),
    );
  });

  it("parses arithmetic expressions with correct operators precedence", () => {
    const ast = parse("24 / 3 - 2.5 * 2 ** 3");

    expect(ast).toEqual(
      new Program([
        new BinaryOperation(
          new BinaryOperation(new Numeral("24"), "/", new Numeral("3")),
          "-",
          new BinaryOperation(
            new Numeral("2.5"),
            "*",
            new BinaryOperation(new Numeral("2"), "**", new Numeral("3")),
          ),
        ),
      ]),
    );
  });

  it("parses pow operator and unary - with the correct precedence", () => {
    const ast = parse("-2 ** 3");

    expect(ast).toEqual(
      new Program([
        new UnaryOperation(
          "-",
          new BinaryOperation(new Numeral("2"), "**", new Numeral("3")),
        ),
      ]),
    );
  });

  it("parses parenthesized arithmetic expressions", () => {
    const ast = parse("(1 + 2) * 3");

    expect(ast).toEqual(
      new Program([
        new BinaryOperation(
          new BinaryOperation(new Numeral("1"), "+", new Numeral("2")),
          "*",
          new Numeral("3"),
        ),
      ]),
    );
  });

  it.each`
    script      | message
    ${"(1 + 2"} | ${"Expected ')' delimiter but got 'Eof' delimiter."}
    ${")"}      | ${"Unexpected ')' delimiter."}
  `(
    "raises an error when the matching bracket is not found",
    ({ script, message }) => {
      expect(() => parse(script)).toThrow(SyntaxError);
      expect(() => parse(script)).toThrow(message);
    },
  );

  it.each`
    input       | operator
    ${"1 + +2"} | ${"+"}
    ${"1 + -2"} | ${"-"}
  `(
    "parses unary arithmetic expressions, like $input",
    ({ input, operator }) => {
      const ast = parse(input);

      expect(ast).toEqual(
        new Program([
          new BinaryOperation(
            new Numeral("1"),
            "+",
            new UnaryOperation(operator, new Numeral("2")),
          ),
        ]),
      );
    },
  );

  describe("variable assignments", () => {
    it("parses simple variable assignments", () => {
      const ast = parse("pi = 3.14");

      expect(ast).toEqual(
        new Program([new VariableAssigment("pi", new Numeral("3.14"))]),
      );
    });

    it("parses expressions assignments", () => {
      const ast = parse("someVar123 = (1 + 2) * 3");

      expect(ast).toEqual(
        new Program([
          new VariableAssigment(
            "someVar123",
            new BinaryOperation(
              new BinaryOperation(new Numeral("1"), "+", new Numeral("2")),
              "*",
              new Numeral("3"),
            ),
          ),
        ]),
      );
    });

    it("parses a chain of assignments", () => {
      const ast = parse("x = y = z = 3");

      expect(ast).toEqual(
        new Program([
          new VariableAssigment(
            "x",
            new VariableAssigment(
              "y",
              new VariableAssigment("z", new Numeral("3")),
            ),
          ),
        ]),
      );
    });

    it("parses variable access", () => {
      const ast = parse("x + 3");

      expect(ast).toEqual(
        new Program([
          new BinaryOperation(new VariableAccess("x"), "+", new Numeral("3")),
        ]),
      );
    });

    it.each`
      script                 | message
      ${"x = fn foo()\nend"} | ${"Unexpected 'fn' keyword."}
      ${"x = "}              | ${"Unexpected 'Eof' delimiter."}
    `("raises errors for invalid assignments", ({ script, message }) => {
      expect(() => parse(script)).toThrow(SyntaxError);
      expect(() => parse(script)).toThrow(message);
    });

    it("parses local assignment", () => {
      const ast = parse("local x = 1");

      expect(ast).toEqual(
        new Program([new VariableAssigment("x", new Numeral("1"), "local")]),
      );
    });

    it("parses outer assignment", () => {
      const ast = parse("outer x = 1");

      expect(ast).toEqual(
        new Program([new VariableAssigment("x", new Numeral("1"), "outer")]),
      );
    });

    it("parses local assignment with expression", () => {
      const ast = parse("local x = 1 + 2");

      expect(ast).toEqual(
        new Program([
          new VariableAssigment(
            "x",
            new BinaryOperation(new Numeral("1"), "+", new Numeral("2")),
            "local",
          ),
        ]),
      );
    });

    it("parses local assignment inside a function body", () => {
      const ast = parse("fn foo()\n  local x = 1\nend");

      expect(ast).toEqual(
        new Program([
          new FunctionDeclaration(
            "foo",
            [],
            [new VariableAssigment("x", new Numeral("1"), "local")],
          ),
        ]),
      );
    });

    it("parses outer assignment inside a function body", () => {
      const ast = parse("fn foo()\n  outer x = 1\nend");

      expect(ast).toEqual(
        new Program([
          new FunctionDeclaration(
            "foo",
            [],
            [new VariableAssigment("x", new Numeral("1"), "outer")],
          ),
        ]),
      );
    });

    describe("compound assignment", () => {
      it("parses plus-equals assignment", () => {
        const ast = parse("x += 5");

        expect(ast).toEqual(
          new Program([
            new VariableAssigment(
              "x",
              new BinaryOperation(
                new VariableAccess("x"),
                "+",
                new Numeral("5"),
              ),
            ),
          ]),
        );
      });

      it("parses minus-equals assignment", () => {
        const ast = parse("counter -= 1");

        expect(ast).toEqual(
          new Program([
            new VariableAssigment(
              "counter",
              new BinaryOperation(
                new VariableAccess("counter"),
                "-",
                new Numeral("1"),
              ),
            ),
          ]),
        );
      });

      it("parses multiply-equals assignment", () => {
        const ast = parse("total *= 2");

        expect(ast).toEqual(
          new Program([
            new VariableAssigment(
              "total",
              new BinaryOperation(
                new VariableAccess("total"),
                "*",
                new Numeral("2"),
              ),
            ),
          ]),
        );
      });

      it("parses divide-equals assignment", () => {
        const ast = parse("value /= 10");

        expect(ast).toEqual(
          new Program([
            new VariableAssigment(
              "value",
              new BinaryOperation(
                new VariableAccess("value"),
                "/",
                new Numeral("10"),
              ),
            ),
          ]),
        );
      });

      it("parses compound assignment with expression", () => {
        const ast = parse("x += 1 + 2");

        expect(ast).toEqual(
          new Program([
            new VariableAssigment(
              "x",
              new BinaryOperation(
                new VariableAccess("x"),
                "+",
                new BinaryOperation(new Numeral("1"), "+", new Numeral("2")),
              ),
            ),
          ]),
        );
      });

      it("parses local compound assignment", () => {
        const ast = parse("local x += 5");

        expect(ast).toEqual(
          new Program([
            new VariableAssigment(
              "x",
              new BinaryOperation(
                new VariableAccess("x"),
                "+",
                new Numeral("5"),
              ),
              "local",
            ),
          ]),
        );
      });

      it("parses outer compound assignment", () => {
        const ast = parse("outer x -= 3");

        expect(ast).toEqual(
          new Program([
            new VariableAssigment(
              "x",
              new BinaryOperation(
                new VariableAccess("x"),
                "-",
                new Numeral("3"),
              ),
              "outer",
            ),
          ]),
        );
      });

      it("parses compound assignment inside function", () => {
        const ast = parse("fn foo()\n  x *= 2\nend");

        expect(ast).toEqual(
          new Program([
            new FunctionDeclaration(
              "foo",
              [],
              [
                new VariableAssigment(
                  "x",
                  new BinaryOperation(
                    new VariableAccess("x"),
                    "*",
                    new Numeral("2"),
                  ),
                ),
              ],
            ),
          ]),
        );
      });
    });
  });

  it("parses a script with several lines of code", () => {
    const ast = parse(`
      x = 1
      y = 2
      x + y * 3
    `);

    expect(ast).toEqual(
      new Program([
        new VariableAssigment("x", new Numeral("1")),
        new VariableAssigment("y", new Numeral("2")),
        new BinaryOperation(
          new VariableAccess("x"),
          "+",
          new BinaryOperation(new VariableAccess("y"), "*", new Numeral("3")),
        ),
      ]),
    );
  });

  describe("function declaration", () => {
    it("parses a declaration without arguments", () => {
      const ast = parse("fn add()\n  x = 1\n  return x + 2\nend");

      expect(ast).toEqual(
        new Program([
          new FunctionDeclaration(
            "add",
            [],
            [
              new VariableAssigment("x", new Numeral("1")),
              new ReturnStatement(
                new BinaryOperation(
                  new VariableAccess("x"),
                  "+",
                  new Numeral("2"),
                ),
              ),
            ],
          ),
        ]),
      );
    });

    it("parses a declaration with arguments", () => {
      const ast = parse("fn add(x, y)\n  return x + y\nend");

      expect(ast).toEqual(
        new Program([
          new FunctionDeclaration(
            "add",
            ["x", "y"],
            [
              new ReturnStatement(
                new BinaryOperation(
                  new VariableAccess("x"),
                  "+",
                  new VariableAccess("y"),
                ),
              ),
            ],
          ),
        ]),
      );
    });

    it.each`
      input
      ${"fn add()\nend"}
      ${"fn add() end"}
    `("parses a declaration with empty body", ({ input }) => {
      const ast = parse(input);

      expect(ast).toEqual(
        new Program([new FunctionDeclaration("add", [], [])]),
      );
    });

    it("parses anonymous function declaration", () => {
      const ast = parse("add = fn(a, b)\n  return a + b\nend");

      expect(ast).toEqual(
        new Program([
          new VariableAssigment(
            "add",
            new FunctionDeclaration(
              undefined,
              ["a", "b"],
              [
                new ReturnStatement(
                  new BinaryOperation(
                    new VariableAccess("a"),
                    "+",
                    new VariableAccess("b"),
                  ),
                ),
              ],
            ),
          ),
        ]),
      );
    });

    it("can't parse declaration assigment to a variable", () => {
      const parseScript = () => parse("x = fn foo()\nend");

      expect(parseScript).toThrow(SyntaxError);
      expect(parseScript).toThrow("Unexpected 'fn' keyword.");
    });

    it.each`
      script                 | message
      ${"fn abc(,x,y)\nend"} | ${"Expected 'Identifier' literal but got ',' delimiter."}
      ${"fn abc(x,)\nend"}   | ${"Expected 'Identifier' literal but got ')' delimiter."}
      ${"fn abc(x,,)\nend"}  | ${"Expected 'Identifier' literal but got ',' delimiter."}
    `(
      "can't parse declaration with invalid arguments",
      ({ script, message }) => {
        const parseScript = () => parse(script);

        expect(parseScript).toThrow(SyntaxError);
        expect(parseScript).toThrow(message);
      },
    );
  });

  describe("function call", () => {
    it("parses a call without arguments", () => {
      const ast = parse("doSomething()");

      expect(ast).toEqual(new Program([new FunctionCall("doSomething", [])]));
    });

    it("parses a call with argument", () => {
      const ast = parse("doSomething(123)");

      expect(ast).toEqual(
        new Program([new FunctionCall("doSomething", [new Numeral("123")])]),
      );
    });

    it("parses a call with multiple arguments", () => {
      const ast = parse("doSomething(1, 2, 1 + 2, bar(123))");

      expect(ast).toEqual(
        new Program([
          new FunctionCall("doSomething", [
            new Numeral("1"),
            new Numeral("2"),
            new BinaryOperation(new Numeral("1"), "+", new Numeral("2")),
            new FunctionCall("bar", [new Numeral("123")]),
          ]),
        ]),
      );
    });

    it("parses assigment of a call result to a variable", () => {
      const ast = parse("x = abc()");

      expect(ast).toEqual(
        new Program([new VariableAssigment("x", new FunctionCall("abc", []))]),
      );
    });

    it("parses calls with the correct priority", () => {
      const ast = parse("foo() + -bar() ** baz()");

      expect(ast).toEqual(
        new Program([
          new BinaryOperation(
            new FunctionCall("foo", []),
            "+",
            new UnaryOperation(
              "-",
              new BinaryOperation(
                new FunctionCall("bar", []),
                "**",
                new FunctionCall("baz", []),
              ),
            ),
          ),
        ]),
      );
    });
  });

  it("parses the nothing literal", () => {
    const ast = parse("nothing");

    expect(ast).toEqual(new Program([new NothingLiteral()]));
  });

  describe("boolean literals", () => {
    it("parses true", () => {
      expect(parse("true")).toEqual(new Program([new BooleanLiteral(true)]));
    });

    it("parses false", () => {
      expect(parse("false")).toEqual(new Program([new BooleanLiteral(false)]));
    });
  });

  describe("not operator", () => {
    it("parses not true", () => {
      expect(parse("not true")).toEqual(
        new Program([new UnaryOperation("not", new BooleanLiteral(true))]),
      );
    });

    it("parses double not (right-associative)", () => {
      expect(parse("not not false")).toEqual(
        new Program([
          new UnaryOperation(
            "not",
            new UnaryOperation("not", new BooleanLiteral(false)),
          ),
        ]),
      );
    });

    it("comparison binds tighter than not: not 1 == 1 parses as not (1 == 1)", () => {
      expect(parse("not 1 == 1")).toEqual(
        new Program([
          new UnaryOperation(
            "not",
            new BinaryOperation(new Numeral("1"), "==", new Numeral("1")),
          ),
        ]),
      );
    });
  });

  it("parses if statement", () => {
    const ast = parse(`
      if x < 1
        x = 1
      end
    `);

    expect(ast).toEqual(
      new Program([
        new IfStatement(
          new BinaryOperation(new VariableAccess("x"), "<", new Numeral("1")),
          [new VariableAssigment("x", new Numeral("1"))],
        ),
      ]),
    );
  });

  it("parses if-else statement", () => {
    const ast = parse(`
      if x < 1
        x = 1
      else
        x = 2
      end
    `);

    expect(ast).toEqual(
      new Program([
        new IfStatement(
          new BinaryOperation(new VariableAccess("x"), "<", new Numeral("1")),
          [new VariableAssigment("x", new Numeral("1"))],
          [new VariableAssigment("x", new Numeral("2"))],
        ),
      ]),
    );
  });

  it("parses if-else statement with else on next line", () => {
    const ast = parse(`
      if x < 1
        x = 1

      else
        x = 2
      end
    `);

    expect(ast).toEqual(
      new Program([
        new IfStatement(
          new BinaryOperation(new VariableAccess("x"), "<", new Numeral("1")),
          [new VariableAssigment("x", new Numeral("1"))],
          [new VariableAssigment("x", new Numeral("2"))],
        ),
      ]),
    );
  });

  it("parses elseif chain", () => {
    const ast = parse(`
      if x < 1
        x = 1
      elseif x < 2
        x = 2
      else
        x = 3
      end
    `);

    expect(ast).toEqual(
      new Program([
        new IfStatement(
          new BinaryOperation(new VariableAccess("x"), "<", new Numeral("1")),
          [new VariableAssigment("x", new Numeral("1"))],
          [
            new IfStatement(
              new BinaryOperation(
                new VariableAccess("x"),
                "<",
                new Numeral("2"),
              ),
              [new VariableAssigment("x", new Numeral("2"))],
              [new VariableAssigment("x", new Numeral("3"))],
            ),
          ],
        ),
      ]),
    );
  });

  describe("while statement", () => {
    it("parses a basic while statement", () => {
      const ast = parse(`
        while true
          x = 1
        end
      `);

      expect(ast).toEqual(
        new Program([
          new WhileStatement(new BooleanLiteral(true), [
            new VariableAssigment("x", new Numeral("1")),
          ]),
        ]),
      );
    });

    it("parses a while statement with empty body", () => {
      expect(parse("while false\nend")).toEqual(
        new Program([new WhileStatement(new BooleanLiteral(false), [])]),
      );
    });

    it("parses a while statement with a comparison condition", () => {
      const ast = parse(`
        while i < 3
          i = i + 1
        end
      `);

      expect(ast).toEqual(
        new Program([
          new WhileStatement(
            new BinaryOperation(new VariableAccess("i"), "<", new Numeral("3")),
            [
              new VariableAssigment(
                "i",
                new BinaryOperation(
                  new VariableAccess("i"),
                  "+",
                  new Numeral("1"),
                ),
              ),
            ],
          ),
        ]),
      );
    });

    it("parses nested while statements", () => {
      const ast = parse(`
        while true
          while false
            1
          end
        end
      `);

      expect(ast).toEqual(
        new Program([
          new WhileStatement(new BooleanLiteral(true), [
            new WhileStatement(new BooleanLiteral(false), [new Numeral("1")]),
          ]),
        ]),
      );
    });

    it("rejects a while with braces around the body", () => {
      expect(() => parse("while true { 1 }")).toThrow(IllegalSymbolError);
    });

    it("rejects a while missing end", () => {
      expect(() => parse("while true\n  1")).toThrow(SyntaxError);
    });

    it("rejects assigning to `while` (it is a reserved keyword)", () => {
      expect(() => parse("while = 1")).toThrow(SyntaxError);
    });
  });

  describe("and / or operators", () => {
    it("parses and", () => {
      expect(parse("true and false")).toEqual(
        new Program([
          new BinaryOperation(
            new BooleanLiteral(true),
            "and",
            new BooleanLiteral(false),
          ),
        ]),
      );
    });

    it("parses or", () => {
      expect(parse("true or false")).toEqual(
        new Program([
          new BinaryOperation(
            new BooleanLiteral(true),
            "or",
            new BooleanLiteral(false),
          ),
        ]),
      );
    });

    it("and has higher precedence than or: a or b and c = a or (b and c)", () => {
      expect(parse("a or b and c")).toEqual(
        new Program([
          new BinaryOperation(
            new VariableAccess("a"),
            "or",
            new BinaryOperation(
              new VariableAccess("b"),
              "and",
              new VariableAccess("c"),
            ),
          ),
        ]),
      );
    });

    it("not has higher precedence than and: not a and b = (not a) and b", () => {
      expect(parse("not a and b")).toEqual(
        new Program([
          new BinaryOperation(
            new UnaryOperation("not", new VariableAccess("a")),
            "and",
            new VariableAccess("b"),
          ),
        ]),
      );
    });

    it("brackets override precedence: a and (b or c)", () => {
      expect(parse("a and (b or c)")).toEqual(
        new Program([
          new BinaryOperation(
            new VariableAccess("a"),
            "and",
            new BinaryOperation(
              new VariableAccess("b"),
              "or",
              new VariableAccess("c"),
            ),
          ),
        ]),
      );
    });

    it("comparison binds tighter than and: true and x > 0 = true and (x > 0)", () => {
      expect(parse("true and x > 0")).toEqual(
        new Program([
          new BinaryOperation(
            new BooleanLiteral(true),
            "and",
            new BinaryOperation(new VariableAccess("x"), ">", new Numeral("0")),
          ),
        ]),
      );
    });
  });

  describe("string literals", () => {
    it("parses a string literal into a StringLiteral node", () => {
      const ast = parse('"hello"') as Program;
      expect(ast.statements[0]).toBeInstanceOf(StringLiteral);
      expect((ast.statements[0] as StringLiteral).value).toBe('"hello"');
    });

    it("parses an empty string", () => {
      const ast = parse('""') as Program;
      expect(ast.statements[0]).toBeInstanceOf(StringLiteral);
      expect((ast.statements[0] as StringLiteral).value).toBe('""');
    });

    it("parses string concatenation as BinaryOperation", () => {
      const ast = parse('"a" + "b"') as Program;
      const node = ast.statements[0] as BinaryOperation;
      expect(node).toBeInstanceOf(BinaryOperation);
      expect(node.operator).toBe("+");
      expect(node.left).toBeInstanceOf(StringLiteral);
      expect(node.right).toBeInstanceOf(StringLiteral);
    });
  });

  describe("several statements in a single line", () => {
    it("parses when statements are separated", () => {
      const ast = parse("1+2;3+4");

      expect(ast).toEqual(
        new Program([
          new BinaryOperation(new Numeral("1"), "+", new Numeral("2")),
          new BinaryOperation(new Numeral("3"), "+", new Numeral("4")),
        ]),
      );
    });

    it("raises an error when statements are not separated", () => {
      expect(() => parse("1+2 3+4")).toThrow(SyntaxError);
    });
  });

  describe("break statement", () => {
    it("parses 'break' inside a while loop", () => {
      const ast = parse("while true\n  break\nend");
      expect(ast).toEqual(
        new Program([
          new WhileStatement(new BooleanLiteral(true), [new BreakStatement()]),
        ]),
      );
    });

    it("parses nested while loop with inner break", () => {
      const ast = parse("while true\n  while false\n    break\n  end\nend");
      expect(ast).toEqual(
        new Program([
          new WhileStatement(new BooleanLiteral(true), [
            new WhileStatement(new BooleanLiteral(false), [
              new BreakStatement(),
            ]),
          ]),
        ]),
      );
    });

    it("parses 'break' inside if block within while", () => {
      const ast = parse("while true\n  if true\n    break\n  end\nend");
      expect(ast).toEqual(
        new Program([
          new WhileStatement(new BooleanLiteral(true), [
            new IfStatement(new BooleanLiteral(true), [new BreakStatement()]),
          ]),
        ]),
      );
    });

    it("parses statement before break in same block", () => {
      const ast = parse("while true\n  x = 1\n  break\nend");
      expect(ast).toEqual(
        new Program([
          new WhileStatement(new BooleanLiteral(true), [
            new VariableAssigment("x", new Numeral("1")),
            new BreakStatement(),
          ]),
        ]),
      );
    });

    it("throws SyntaxError for 'break' at top level", () => {
      expect(() => parse("break")).toThrow(
        new SyntaxError("'break' used outside a loop"),
      );
    });

    it("throws SyntaxError for 'break' inside if without enclosing loop", () => {
      expect(() => parse("if true\n  break\nend")).toThrow(
        new SyntaxError("'break' used outside a loop"),
      );
    });

    it("throws SyntaxError for 'break' inside named function", () => {
      expect(() => parse("fn foo()\n  break\nend")).toThrow(
        new SyntaxError("'break' used outside a loop"),
      );
    });

    it("throws SyntaxError for 'break' inside function nested in loop", () => {
      expect(() =>
        parse("while true\n  fn foo()\n    break\n  end\nend"),
      ).toThrow(new SyntaxError("'break' used outside a loop"));
    });
  });

  describe("continue statement", () => {
    it("parses 'continue' inside a while loop with if", () => {
      const ast = parse(
        "while i < 10\n  if i == 3\n    continue\n  end\n  i = i + 1\nend",
      );
      expect(ast).toEqual(
        new Program([
          new WhileStatement(
            new BinaryOperation(
              new VariableAccess("i"),
              "<",
              new Numeral("10"),
            ),
            [
              new IfStatement(
                new BinaryOperation(
                  new VariableAccess("i"),
                  "==",
                  new Numeral("3"),
                ),
                [new ContinueStatement()],
              ),
              new VariableAssigment(
                "i",
                new BinaryOperation(
                  new VariableAccess("i"),
                  "+",
                  new Numeral("1"),
                ),
              ),
            ],
          ),
        ]),
      );
    });

    it("parses loop with both break and continue", () => {
      const ast = parse("while true\n  break\n  continue\nend");
      expect(ast).toEqual(
        new Program([
          new WhileStatement(new BooleanLiteral(true), [
            new BreakStatement(),
            new ContinueStatement(),
          ]),
        ]),
      );
    });

    it("parses 'continue' inside else block within while", () => {
      const ast = parse(
        "while true\n  if true\n    break\n  else\n    continue\n  end\nend",
      );
      expect(ast).toEqual(
        new Program([
          new WhileStatement(new BooleanLiteral(true), [
            new IfStatement(
              new BooleanLiteral(true),
              [new BreakStatement()],
              [new ContinueStatement()],
            ),
          ]),
        ]),
      );
    });

    it("throws SyntaxError for 'continue' at top level", () => {
      expect(() => parse("continue")).toThrow(
        new SyntaxError("'continue' used outside a loop"),
      );
    });

    it("throws SyntaxError for 'continue' inside anonymous function nested in loop", () => {
      expect(() =>
        parse("while true\n  x = fn()\n    continue\n  end\nend"),
      ).toThrow(new SyntaxError("'continue' used outside a loop"));
    });
  });

  describe("then keyword", () => {
    it("parses single-line if with then", () => {
      const ast = parse("if true then 1 end");

      expect(ast).toEqual(
        new Program([
          new IfStatement(new BooleanLiteral(true), [new Numeral("1")]),
        ]),
      );
    });

    it("parses single-line while with then", () => {
      const ast = parse("while true then break end");

      expect(ast).toEqual(
        new Program([
          new WhileStatement(new BooleanLiteral(true), [new BreakStatement()]),
        ]),
      );
    });
  });

  describe("elseif keyword", () => {
    it("parses if-elseif-else chain", () => {
      const ast = parse("if a\n  1\nelseif b\n  2\nelse\n  3\nend");

      expect(ast).toEqual(
        new Program([
          new IfStatement(
            new VariableAccess("a"),
            [new Numeral("1")],
            [
              new IfStatement(
                new VariableAccess("b"),
                [new Numeral("2")],
                [new Numeral("3")],
              ),
            ],
          ),
        ]),
      );
    });

    it("parses multiple elseif branches", () => {
      const ast = parse("if a\n  1\nelseif b\n  2\nelseif c\n  3\nend");

      expect(ast).toEqual(
        new Program([
          new IfStatement(
            new VariableAccess("a"),
            [new Numeral("1")],
            [
              new IfStatement(
                new VariableAccess("b"),
                [new Numeral("2")],
                [new IfStatement(new VariableAccess("c"), [new Numeral("3")])],
              ),
            ],
          ),
        ]),
      );
    });

    it("rejects 'else if' as two separate keywords", () => {
      expect(() => parse("if a\n  1\nelse if b\n  2\nend")).toThrow(
        SyntaxError,
      );
    });
  });

  describe("short-form lambda", () => {
    it("parses single-parameter short-form lambda", () => {
      const ast = parse("fn(x) x * 2");

      expect(ast).toEqual(
        new Program([
          new FunctionDeclaration(
            undefined,
            ["x"],
            [
              new ReturnStatement(
                new BinaryOperation(
                  new VariableAccess("x"),
                  "*",
                  new Numeral("2"),
                ),
              ),
            ],
          ),
        ]),
      );
    });

    it("parses multi-parameter short-form lambda", () => {
      const ast = parse("fn(a, b) a + b");

      expect(ast).toEqual(
        new Program([
          new FunctionDeclaration(
            undefined,
            ["a", "b"],
            [
              new ReturnStatement(
                new BinaryOperation(
                  new VariableAccess("a"),
                  "+",
                  new VariableAccess("b"),
                ),
              ),
            ],
          ),
        ]),
      );
    });

    it("parses short-form lambda as callback argument", () => {
      const ast = parse("foo(fn(x) x * 2)");

      expect(ast).toEqual(
        new Program([
          new FunctionCall("foo", [
            new FunctionDeclaration(
              undefined,
              ["x"],
              [
                new ReturnStatement(
                  new BinaryOperation(
                    new VariableAccess("x"),
                    "*",
                    new Numeral("2"),
                  ),
                ),
              ],
            ),
          ]),
        ]),
      );
    });

    it("rejects 'end' after short-form lambda", () => {
      expect(() => parse("fn(x) x * 2 end")).toThrow(SyntaxError);
    });

    it("rejects named function with short form", () => {
      expect(() => parse("fn add(a, b) a + b")).toThrow(SyntaxError);
    });
  });

  describe("new syntax errors", () => {
    it("rejects braces in function body", () => {
      expect(() => parse("fn foo() { return 1 }")).toThrow(IllegalSymbolError);
    });

    it("rejects function missing end", () => {
      expect(() => parse("fn foo()\n  return 1")).toThrow(SyntaxError);
    });
  });
});
