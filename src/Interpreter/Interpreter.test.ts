import { parse } from "../testingUtils";
import { Interpreter } from "./Interpreter";
import { LuckyNumber, LuckyObject } from "./LuckyObject";

function run(
  script: string,
  symbolTable?: Map<string, LuckyObject>
): undefined | number {
  const ast = parse(script);
  const interpreter = new Interpreter(ast, symbolTable);

  return interpreter.run();
}

describe("Interpreter", () => {
  it.each`
    script         | value
    ${"0"}         | ${0}
    ${"123"}       | ${123}
    ${"1_000"}     | ${1000}
    ${"1_000_000"} | ${1000000}
    ${"0.5"}       | ${0.5}
  `("interprets numerals, like $script", ({ script, value }) => {
    expect(run(script)).toEqual(value);
  });

  it.each`
    script                       | expected
    ${"(1 + 2) * 3 - -(1 + .5)"} | ${10.5}
    ${"2 * 2**3"}                | ${16}
    ${"2 * 2**3"}                | ${16}
    ${"-2**3"}                   | ${-8}
    ${"-2**4"}                   | ${-16}
    ${"(-2)**4"}                 | ${16}
  `(
    "evaluates arithmetic expression $script to $expected",
    ({ script, expected }) => {
      expect(run(script)).toBe(expected);
    }
  );

  describe("variables handling", () => {
    it("sets variables", () => {
      const symbolTable = new Map<string, LuckyObject>();

      expect(run("pi = 3.14", symbolTable)).toBe(3.14);
      expect(symbolTable.get("pi")).toEqual(new LuckyNumber(3.14));
    });

    it("sets a chain of variables", () => {
      const symbolTable = new Map<string, LuckyObject>();

      expect(run("x = y = 1", symbolTable)).toBe(1);
      expect(symbolTable.get("x")).toEqual(new LuckyNumber(1));
      expect(symbolTable.get("y")).toEqual(new LuckyNumber(1));
    });

    it("reads variables", () => {
      const symbolTable = new Map<string, LuckyObject>([
        ["x", new LuckyNumber(1)],
        ["y", new LuckyNumber(2)],
      ]);

      expect(run("x + y + 3", symbolTable)).toBe(6);
    });

    it("increments the given variable", () => {
      const symbolTable = new Map<string, LuckyObject>([
        ["x", new LuckyNumber(1)],
      ]);

      expect(run("x = x + 1", symbolTable)).toBe(2);
      expect(symbolTable.get("x")).toEqual(new LuckyNumber(2));
    });

    it("raises an error on access to undefined variable", () => {
      expect(() => run("undefinedVariable + 1")).toThrow(
        "Undefined variable undefinedVariable"
      );
    });
  });

  it("interprets programs that have several lines of script", () => {
    const script = `
      x = 1
      y = 2
      x + y * 2
    `;

    expect(run(script)).toBe(5);
  });

  it("interprets empty set of statements", () => {
    expect(run("")).toBe(0);
  });

  describe("functions", () => {
    it("interprets function calls", () => {
      const script = `
        function foo() {
          return 1 + 2
        }
        
        foo()
      `;

      expect(run(script)).toBe(3);
    });

    it("obeys the return statement", () => {
      const script = `
        function foo() {
          return 1 + 2
          
          # These lines should be skipped
          
          3
          4
          return 5
        }
        
        foo()
      `;

      expect(run(script)).toBe(3);
    });

    it("returns 0 when return statement is not present", () => {
      const script = `
        function foo() { 123 }
        foo()
    `;

      expect(run(script)).toBe(0);
    });

    it("interprets nested function declaration", () => {
      const script = `
        function foo() {
          function bar() { return 3 }
        
          return 1 + 2 + bar()
        }
        
        foo()
    `;

      expect(run(script)).toBe(6);
    });

    it("interprets anonymous functions", () => {
      const script = `
        foo = function () { 
          x = 1
          
          # Yes! It's a function that returns another function ;)
          return function () {
            return x + 2
          }
        }
        
        bar = foo()
        bar()
      `;

      expect(run(script)).toBe(3);
    });

    it("raises an error on illegal binary operation", () => {
      const script = `
        function foo() { return 1 }
        
        1 + foo
    `;

      expect(() => run(script)).toThrow("Illegal operation");
    });

    it("raises an error when return is given outside a function body", () => {
      expect(() => run("return 123")).toThrow(
        "Unsupported AST node type ReturnStatement"
      );
    });

    it("raises an error on illegal unary operation", () => {
      const script = `
        function foo() { return 1 }
        
        -foo
    `;

      expect(() => run(script)).toThrow("Illegal operation");
    });

    it("raises an error when the given identifier is not callable", () => {
      const script = `
        notAFunction = 123
        notAFunction()
    `;

      expect(() => run(script)).toThrow(
        "The given identifier 'notAFunction' is not callable"
      );
    });

    it("allows to re-assign the function to a new identifier", () => {
      const script = `
        function foo() { return 41 }
        bar = foo
        bar()
    `;

      expect(run(script)).toBe(41);
    });
  });

  // TODO: Nice to have someday
  it.skip("interprets blocks of script", () => {
    const script = `
    a = 1
    c = 0
    
    {
      b = 2
      c = a + b
    }
    `;

    const symbolTable = new Map<string, LuckyObject>();
    run(script, symbolTable);

    expect(symbolTable.has("a")).toBe(true);

    // TODO: It should create a new scope for block variable
    expect(symbolTable.has("b")).toBe(true);

    expect(symbolTable.has("c")).toBe(true);
    expect(symbolTable.get("c")).toBe(3);
  });
});
