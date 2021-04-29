import { parse } from "../testingUtils";
import { NameError, RuntimeError, ZeroDivisionError } from "./errors";
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

  it("raises an error on division by zero", () => {
    expect(() => run("2 / 0")).toThrow(ZeroDivisionError);
  });

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
      const runScript = () => run("undefinedVariable + 1");

      expect(runScript).toThrow(NameError);
      expect(runScript).toThrow("Identifier undefinedVariable is not defined");
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

    it("interprets function calls with arguments", () => {
      const script = `
        function add(x, y) {
          return x + y
        }
        
        add(1, 2)
      `;

      expect(run(script)).toBe(3);
    });

    it("interprets function calls with complex arguments", () => {
      const script = `
        function giveMeOne() { return 1 }
      
        function add(x, fn) {
          # Yes! It can take another function as parameter.
          return x + fn()
        }
        
        # A function call could take anonymous function
        add(giveMeOne(), function () { return 2 })
      `;

      expect(run(script)).toBe(3);
    });

    it.each`
      args
      ${""}
      ${"1"}
      ${"1,2,3"}
    `(
      "raises an error when invalid number of arguments is given",
      ({ args }) => {
        const script = `
          function add(x, y) {
            return x + y
          }
          
          add(${args})
        `;

        const runScript = () => run(script);

        expect(runScript).toThrow(RuntimeError);
        expect(runScript).toThrow("Function add takes exactly 2 parameters");
      }
    );

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

    it("returns 0 when the return statement is not present", () => {
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

      const runScript = () => run(script);

      expect(runScript).toThrow(RuntimeError);
      expect(runScript).toThrow("Illegal operation");
    });

    it("raises an error when return is given outside a function body", () => {
      const runScript = () => run("return 123");

      expect(runScript).toThrow(RuntimeError);
      expect(runScript).toThrow("Unsupported AST node type ReturnStatement");
    });

    it("raises an error on illegal unary operation", () => {
      const script = `
        function foo() { return 1 }
        
        -foo
    `;

      const runScript = () => run(script);

      expect(runScript).toThrow(RuntimeError);
      expect(runScript).toThrow("Illegal operation");
    });

    it("raises an error when the given identifier is not callable", () => {
      const script = `
        notAFunction = 123
        notAFunction()
    `;

      const runScript = () => run(script);

      expect(runScript).toThrow(RuntimeError);
      expect(runScript).toThrow(
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
