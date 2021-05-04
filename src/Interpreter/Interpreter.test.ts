import { parse } from "../testingUtils";
import { NameError, RuntimeError, ZeroDivisionError } from "./errors";
import { Interpreter } from "./Interpreter";
import { LuckyNumber } from "./objects";
import { SymbolTable } from "./SymbolTable";

function run(script: string, symbolTable?: SymbolTable) {
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

  describe("arithmetic expressions", () => {
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
  });

  describe("comparisons", () => {
    it.each`
      input          | expected
      ${"1 < 2"}     | ${true}
      ${"1 < 2 - 1"} | ${false}
      ${"2 * 2 < 1"} | ${false}
      ${"1 <= 1"}    | ${true}
      ${"1 < 1"}     | ${false}
      ${"2 == 2"}    | ${true}
      ${"2 > 2"}     | ${false}
      ${"2 >= 2"}    | ${true}
    `("interprets comparisons, like $input", ({ input, expected }) => {
      expect(run(input)).toBe(expected);
    });

    it("raises an error on invalid comparison", () => {
      const runScript = () => run("1 < 2 < 3");

      expect(runScript).toThrow(RuntimeError);
      expect(runScript).toThrow("Illegal operation");
    });
  });

  describe("variables handling", () => {
    it("sets variables", () => {
      const symbolTable = new SymbolTable();

      expect(run("pi = 3.14", symbolTable)).toBe(3.14);
      expect(symbolTable.lookup("pi")).toEqual(new LuckyNumber(3.14));
    });

    it("sets a chain of variables", () => {
      const symbolTable = new SymbolTable();

      expect(run("x = y = 1", symbolTable)).toBe(1);
      expect(symbolTable.lookup("x")).toEqual(new LuckyNumber(1));
      expect(symbolTable.lookup("y")).toEqual(new LuckyNumber(1));
    });

    it("reads variables", () => {
      const symbolTable = new SymbolTable();
      symbolTable.set("x", new LuckyNumber(1));
      symbolTable.set("y", new LuckyNumber(2));

      expect(run("x + y + 3", symbolTable)).toBe(6);
    });

    it("increments the given variable", () => {
      const symbolTable = new SymbolTable();
      symbolTable.set("x", new LuckyNumber(1));

      expect(run("x = x + 1", symbolTable)).toBe(2);
      expect(symbolTable.lookup("x")).toEqual(new LuckyNumber(2));
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

    describe("calling functions with invalid number of arguments", () => {
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

      it("raises an error when anonymous function is called with invalid number of arguments", () => {
        const script = `;
          foo = function (x, y) { return x + y }
          
          foo(1, 2, 3)
        `;

        expect(() => run(script)).toThrow(
          new RuntimeError("Function foo takes exactly 2 parameters")
        );
      });
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

    it("raises an error when the given identifier is not defined", () => {
      expect(() => run("foo()")).toThrow(new NameError("foo"));
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

  describe("variable scopes", () => {
    it("creates valid scopes for function calls", () => {
      const symbolTable = new SymbolTable();
      const script = `
        a = 1
        
        function foo() {
          a = 2 # Should replace value of on the parent scope
          b = 1 # Should be accessible only in the current scope
          
          function bar() {
            c = 3 # Should be accessible only in the current scope
            return a + b + c
          }
          
          return bar()
        }
        
        d = foo()
      `;

      run(script, symbolTable);

      expect(symbolTable.lookup("d")).toEqual(new LuckyNumber(6));
      expect(symbolTable.lookup("a")).toEqual(new LuckyNumber(2));

      expect(() => symbolTable.lookup("b")).toThrow(NameError);
      expect(() => symbolTable.lookup("c")).toThrow(NameError);
    });

    it("allows to use dynamic scopes", () => {
      const symbolTable = new SymbolTable();
      const script = `
        a = 1
        
        function add() {
          # Currently a is 1, but later its value will be changed
          
          return a + 1
        }
        
        firstResult = add()
        
        a = 2
        secondResult = add()
      `;

      run(script, symbolTable);

      expect(symbolTable.lookup("firstResult")).toEqual(new LuckyNumber(2));
      expect(symbolTable.lookup("secondResult")).toEqual(new LuckyNumber(3));
    });

    it("creates local variables for arguments passed to function call", () => {
      const symbolTable = new SymbolTable();
      const script = `
        x = 1
  
        function foo(x) {
          # Function argument x should shadow x from the parent scope
          x = x + 1
          
          return x + 1
        }
  
        y = foo(2)
      `;

      run(script, symbolTable);

      expect(symbolTable.lookup("x")).toEqual(new LuckyNumber(1));
      expect(symbolTable.lookup("y")).toEqual(new LuckyNumber(4));
    });
  });

  describe("if statements", () => {
    it("interprets a simple if statement", () => {
      const symbolTable = new SymbolTable();
      const script = `
        x = 0
        
        if (x < 1) {
          x = 1
        }
      `;

      run(script, symbolTable);
      expect(symbolTable.lookup("x")).toEqual(new LuckyNumber(1));
    });
  });
});
