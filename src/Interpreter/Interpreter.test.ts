import { parse } from "../testingUtils";
import { Interpreter } from "./Interpreter";

describe("Interpreter", () => {
  it.each`
    input          | value
    ${"0"}         | ${0}
    ${"123"}       | ${123}
    ${"1_000"}     | ${1000}
    ${"1_000_000"} | ${1000000}
    ${"0.5"}       | ${0.5}
  `("interprets numerals, like $input", ({ input, value }) => {
    const ast = parse(input);
    const interpreter = new Interpreter(ast);

    expect(interpreter.run()).toEqual(value);
  });

  it.each`
    input                        | expected
    ${"(1 + 2) * 3 - -(1 + .5)"} | ${10.5}
    ${"2 * 2**3"}                | ${16}
    ${"2 * 2**3"}                | ${16}
    ${"-2**3"}                   | ${-8}
    ${"-2**4"}                   | ${-16}
    ${"(-2)**4"}                 | ${16}
  `(
    "evaluates arithmetic expression $input to $expected",
    ({ input, expected }) => {
      const ast = parse(input);
      const interpreter = new Interpreter(ast);

      expect(interpreter.run()).toBe(expected);
    }
  );

  describe("variables handling", () => {
    it("sets variables", () => {
      const variables = new Map<string, number>();
      const ast = parse("pi = 3.14");

      const interpreter = new Interpreter(ast, variables);

      expect(interpreter.run()).toBe(3.14);
      expect(variables.get("pi")).toBe(3.14);
    });

    it("sets a chain of variables", () => {
      const symbolTable = new Map<string, number>();
      const ast = parse("x=y=1");

      const interpreter = new Interpreter(ast, symbolTable);

      expect(interpreter.run()).toBe(1);
      expect(symbolTable.get("x")).toBe(1);
      expect(symbolTable.get("y")).toBe(1);
    });

    it("reads variables", () => {
      const symbolTable = new Map<string, number>([
        ["x", 1],
        ["y", 2],
      ]);
      const ast = parse("x + y + 3");

      const interpreter = new Interpreter(ast, symbolTable);

      expect(interpreter.run()).toBe(6);
    });

    it("increments the given variable", () => {
      const symbolTable = new Map<string, number>([["x", 1]]);
      const ast = parse("x = x + 1");

      const interpreter = new Interpreter(ast, symbolTable);

      expect(interpreter.run()).toBe(2);
      expect(symbolTable.get("x")).toBe(2);
    });

    it("raises an error on access to undefined variable", () => {
      const ast = parse("x + 1");
      const interpreter = new Interpreter(ast);

      expect(() => interpreter.run()).toThrow("Undefined variable x");
    });
  });

  it("interprets programs that have several lines of code", () => {
    const ast = parse(`
    x = 1
    y = 2
    x + y * 2
    `);
    const interpreter = new Interpreter(ast);

    expect(interpreter.run()).toBe(5);
  });

  it("interprets empty set of statements", () => {
    const ast = parse("");
    const interpreter = new Interpreter(ast);

    expect(interpreter.run()).toBe(0);
  });

  describe("functions", () => {
    it("interprets function calls", () => {
      const ast = parse(`
        function foo() {
          return 1 + 2
        }
        
        foo()
    `);

      const interpreter = new Interpreter(ast);
      expect(interpreter.run()).toBe(3);
    });

    it("obeys the return statement", () => {
      const ast = parse(`
        function foo() {
          return 1 + 2
          
          # These lines should be skipped
          
          3
          4
          return 5
        }
        
        foo()
    `);

      const interpreter = new Interpreter(ast);
      expect(interpreter.run()).toBe(3);
    });

    it("returns 0 when return statement is not present", () => {
      const ast = parse(`
        function foo() { 123 }
        foo()
    `);

      const interpreter = new Interpreter(ast);
      expect(interpreter.run()).toBe(0);
    });

    it("interprets nested function declaration", () => {
      const ast = parse(`
        function foo() {
          function bar() { return 3 }
        
          return 1 + 2 + bar()
        }
        
        foo()
    `);

      const interpreter = new Interpreter(ast);
      expect(interpreter.run()).toBe(6);
    });

    it("interprets anonymous functions", () => {
      const ast = parse(`
        foo = function () { 
          x = 1
          
          # Yes! It's a function that returns another function ;)
          return function () {
            return x + 2
          }
        }
        
        bar = foo()
        bar()
      `);

      const interpreter = new Interpreter(ast);
      expect(interpreter.run()).toBe(3);
    });

    it("raises an error on illegal binary operation", () => {
      const ast = parse(`
        function foo() { return 1 }
        
        1 + foo
    `);

      const interpreter = new Interpreter(ast);
      expect(() => interpreter.run()).toThrow("Illegal operation");
    });

    it("raises an error when return is given outside a function body", () => {
      const ast = parse("return 123");

      const interpreter = new Interpreter(ast);
      expect(() => interpreter.run()).toThrow(
        "Unsupported AST node type ReturnStatement"
      );
    });

    it("raises an error on illegal unary operation", () => {
      const ast = parse(`
        function foo() { return 1 }
        
        -foo
    `);

      const interpreter = new Interpreter(ast);
      expect(() => interpreter.run()).toThrow("Illegal operation");
    });

    it("raises an error when the given identifier is not callable", () => {
      const ast = parse(`
        notAFunction = 123
        notAFunction()
    `);

      const interpreter = new Interpreter(ast);
      expect(() => interpreter.run()).toThrow(
        "The given identifier 'notAFunction' is not callable"
      );
    });

    it("allows to re-assign the function to a new identifier", () => {
      const ast = parse(`
        function foo() { return 41 }
        bar = foo
        bar()
    `);

      const interpreter = new Interpreter(ast);
      expect(interpreter.run()).toBe(41);
    });
  });

  // TODO: Nice to have someday
  it.skip("interprets blocks of code", () => {
    const ast = parse(`
    a = 1
    c = 0
    
    {
      b = 2
      c = a + b
    }
    `);

    const symbolTable = new Map<string, number>();
    const interpreter = new Interpreter(ast, symbolTable);
    interpreter.run();

    expect(symbolTable.has("a")).toBe(true);

    // TODO: It should create a new scope for block variable
    expect(symbolTable.has("b")).toBe(true);

    expect(symbolTable.has("c")).toBe(true);
    expect(symbolTable.get("c")).toBe(3);
  });
});
