import { describe, expect, it } from "vitest";

import { run } from "../testingUtils";
import { NameError, RuntimeError, ZeroDivisionError } from "./errors";
import { LuckyNumber } from "./objects";
import { SymbolTable } from "./SymbolTable";

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
      },
    );

    it("evaluates unary plus to the same value", () => {
      expect(run("+5")).toBe(5);
    });

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
      ${"1 != 2"}    | ${true}
      ${"2 != 2"}    | ${false}
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

      expect(run("let pi = 3.14", symbolTable)).toBe(3.14);
      expect(symbolTable.lookup("pi")).toEqual(new LuckyNumber(3.14));
    });

    it("sets a chain of variables", () => {
      const symbolTable = new SymbolTable();

      expect(run("let x = 0\nlet y = 0\nx = y = 1", symbolTable)).toBe(1);
      expect(symbolTable.lookup("x")).toEqual(new LuckyNumber(1));
      expect(symbolTable.lookup("y")).toEqual(new LuckyNumber(1));
    });

    it("reads variables", () => {
      const symbolTable = new SymbolTable();
      symbolTable.declare("x", new LuckyNumber(1));
      symbolTable.declare("y", new LuckyNumber(2));

      expect(run("x + y + 3", symbolTable)).toBe(6);
    });

    it("increments the given variable", () => {
      const symbolTable = new SymbolTable();
      symbolTable.declare("x", new LuckyNumber(1));

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
      let x = 1
      let y = 2
      x + y * 2
    `;

    expect(run(script)).toBe(5);
  });

  it("interprets empty set of statements", () => {
    expect(run("")).toBe(undefined);
  });

  describe("functions", () => {
    it("interprets function calls", () => {
      const script = `
        fun foo() do
          return 1 + 2
        end

        foo()
      `;

      expect(run(script)).toBe(3);
    });

    it("interprets function calls with arguments", () => {
      const script = `
        fun add(x, y) do
          return x + y
        end

        add(1, 2)
      `;

      expect(run(script)).toBe(3);
    });

    it("interprets function calls with complex arguments", () => {
      const script = `
        fun giveMeOne() do
          return 1
        end

        fun add(x, f) do
          return x + f()
        end

        add(giveMeOne(), fun () 2)
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
            fun add(x, y) do
              return x + y
            end

            add(${args})
          `;

          const runScript = () => run(script);

          expect(runScript).toThrow(RuntimeError);
          expect(runScript).toThrow("Function add takes exactly 2 parameters");
        },
      );

      it("raises an error when anonymous function is called with invalid number of arguments", () => {
        const script = `
          let foo = fun (x, y) do
            return x + y
          end

          foo(1, 2, 3)
        `;

        expect(() => run(script)).toThrow(
          new RuntimeError("Function foo takes exactly 2 parameters"),
        );
      });
    });

    it("obeys the return statement", () => {
      const script = `
        fun foo() do
          return 1 + 2

          3
          4
          return 5
        end

        foo()
      `;

      expect(run(script)).toBe(3);
    });

    it("returns nothing when the return statement is not present", () => {
      const script = `
        fun foo() do
          123
        end
        foo()
    `;

      expect(run(script)).toBe(undefined);
    });

    it("interprets nested function declaration", () => {
      const script = `
        fun foo() do
          fun bar() do
            return 3
          end

          return 1 + 2 + bar()
        end

        foo()
    `;

      expect(run(script)).toBe(6);
    });

    it("interprets anonymous functions", () => {
      const script = `
        let foo = fun () do
          let x = 1

          return fun () do
            return x + 2
          end
        end

        let bar = foo()
        bar()
      `;

      expect(run(script)).toBe(3);
    });

    it("raises an error on illegal binary operation", () => {
      const script = `
        fun foo() do
          return 1
        end

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
        fun foo() do
          return 1
        end

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
        let notAFunction = 123
        notAFunction()
      `;

      const runScript = () => run(script);

      expect(runScript).toThrow(RuntimeError);
      expect(runScript).toThrow(
        "The given identifier 'notAFunction' is not callable",
      );
    });

    it("allows to re-assign the function to a new identifier", () => {
      const script = `
        fun foo() do
          return 41
        end
        let bar = foo
        bar()
    `;

      expect(run(script)).toBe(41);
    });
  });

  describe("variable scopes", () => {
    it("creates valid scopes for function calls", () => {
      const symbolTable = new SymbolTable();
      const script = `
        let a = 1

        fun foo() do
          let a = 2
          let b = 1

          fun bar() do
            let c = 3
            return a + b + c
          end

          return bar()
        end

        let d = foo()
      `;

      run(script, symbolTable);

      expect(symbolTable.lookup("d")).toEqual(new LuckyNumber(6));
      expect(symbolTable.lookup("a")).toEqual(new LuckyNumber(1));

      expect(() => symbolTable.lookup("b")).toThrow(NameError);
      expect(() => symbolTable.lookup("c")).toThrow(NameError);
    });

    it("allows to use dynamic scopes", () => {
      const symbolTable = new SymbolTable();
      const script = `
        let a = 1

        fun add() do
          return a + 1
        end

        let firstResult = add()

        let a = 2
        let secondResult = add()
      `;

      run(script, symbolTable);

      expect(symbolTable.lookup("firstResult")).toEqual(new LuckyNumber(2));
      expect(symbolTable.lookup("secondResult")).toEqual(new LuckyNumber(3));
    });

    it("creates let variables for arguments passed to function call", () => {
      const symbolTable = new SymbolTable();
      const script = `
        let x = 1

        fun foo(x) do
          let x = x + 1

          return x + 1
        end

        let y = foo(2)
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
        let x = 0

        if x < 1 then
          let x = 1
        end
      `;

      run(script, symbolTable);
      expect(symbolTable.lookup("x")).toEqual(new LuckyNumber(1));
    });

    it("assignments inside if-block are visible in the enclosing scope", () => {
      const script = `
        let x = 1
        if x < 2 then
          let y = 99
        end
        y
      `;

      expect(run(script)).toBe(99);
    });

    it("executes else branch when condition is false", () => {
      const symbolTable = new SymbolTable();
      const script = `
        let x = 5

        if x < 1 then
          let x = 1
        else
          let x = 99
        end
      `;

      run(script, symbolTable);
      expect(symbolTable.lookup("x")).toEqual(new LuckyNumber(99));
    });

    it("skips else branch when condition is true", () => {
      const symbolTable = new SymbolTable();
      const script = `
        let x = 0

        if x < 1 then
          let x = 1
        else
          let x = 99
        end
      `;

      run(script, symbolTable);
      expect(symbolTable.lookup("x")).toEqual(new LuckyNumber(1));
    });

    it("supports else on next line", () => {
      const symbolTable = new SymbolTable();
      const script = `
        let x = 5

        if x < 1 then
          let x = 1
        else
          let x = 99
        end
      `;

      run(script, symbolTable);
      expect(symbolTable.lookup("x")).toEqual(new LuckyNumber(99));
    });

    it("supports else-if chain", () => {
      const symbolTable = new SymbolTable();
      const script = `
        let x = 5

        if x < 1 then
          let x = 1
        elseif x < 10 then
          let x = 10
        else
          let x = 99
        end
      `;

      run(script, symbolTable);
      expect(symbolTable.lookup("x")).toEqual(new LuckyNumber(10));
    });

    it("assignments inside else-block are visible in the enclosing scope", () => {
      const script = `
        let x = 5
        if x < 1 then
          let y = 1
        else
          let y = 99
        end
        y
      `;

      expect(run(script)).toBe(99);
    });
  });

  describe("while statements", () => {
    it("does not execute the body when the condition is false", () => {
      const symbolTable = new SymbolTable();
      const script = `
        let count = 0
        while false do
        end
      `;

      run(script, symbolTable);
      expect(symbolTable.lookup("count")).toEqual(new LuckyNumber(0));
    });

    it("re-evaluates the condition each iteration and terminates when it is false", () => {
      const symbolTable = new SymbolTable();
      const script = `
        let i = 0
        while i < 3 do
          let i = i + 1
        end
      `;

      run(script, symbolTable);
      expect(symbolTable.lookup("i")).toEqual(new LuckyNumber(3));
    });

    it("coerces a non-boolean condition via toBoolean", () => {
      const symbolTable = new SymbolTable();
      const script = `
        let n = 3
        while n do
          let n = n - 1
        end
      `;

      run(script, symbolTable);
      expect(symbolTable.lookup("n")).toEqual(new LuckyNumber(0));
    });

    it("accepts an empty body", () => {
      const symbolTable = new SymbolTable();
      const script = `
        let i = 0
        let i = i + 1
        while false do
        end
      `;

      run(script, symbolTable);
      expect(symbolTable.lookup("i")).toEqual(new LuckyNumber(1));
    });

    it("evaluates to nothing", () => {
      expect(run("while false do\n  42\nend")).toBe(undefined);
    });

    it("a bare assignment inside the body persists after the loop", () => {
      const symbolTable = new SymbolTable();
      const script = `
        let n = 0
        while n < 3 do
          let n = n + 1
        end
      `;

      run(script, symbolTable);
      expect(symbolTable.lookup("n")).toEqual(new LuckyNumber(3));
    });

    it("a new variable introduced inside the body is visible after the loop", () => {
      const script = `
        let i = 0
        while i < 1 do
          let result = 42
          let i = i + 1
        end
        result
      `;
      expect(run(script)).toBe(42);
    });

    it("let inside a while body inside a function binds in the function scope", () => {
      const script = `
        fun foo() do
          let i = 0
          while i < 1 do
            let x = 7
            let i = i + 1
          end
          return x
        end
        foo()
      `;
      expect(run(script)).toBe(7);
    });

    it("a return inside the body exits the enclosing function", () => {
      const script = `
        fun foo() do
          let i = 0
          while true do
            if i == 2 then
              return i
            end
            let i = i + 1
          end
        end
        foo()
      `;
      expect(run(script)).toBe(2);
    });
  });

  describe("nothing literal", () => {
    it("evaluates the nothing literal", () => {
      expect(run("nothing")).toBe(undefined);
    });

    it("considers nothing equal to nothing", () => {
      expect(run("nothing == nothing")).toBe(true);
    });

    it("considers nothing not equal to a number", () => {
      expect(run("nothing == 0")).toBe(false);
      expect(run("nothing != 0")).toBe(true);
    });

    it("treats nothing as falsy in if statement", () => {
      const symbolTable = new SymbolTable();
      const script = `
        let x = 1
        if nothing then
          let x = 2
        end
      `;

      run(script, symbolTable);
      expect(symbolTable.lookup("x")).toEqual(new LuckyNumber(1));
    });

    it("rejects arithmetic with nothing", () => {
      expect(() => run("nothing + 1")).toThrow("Illegal operation");
    });

    it("allows assigning nothing to a variable", () => {
      expect(run("let x = nothing")).toBe(undefined);
    });

    it("allows returning nothing from a function", () => {
      const script = `
        fun foo() do
          return nothing
        end
        foo()
      `;
      expect(run(script)).toBe(undefined);
    });
  });

  describe("variable scoping rules", () => {
    it("bare write inside a function does not mutate binding", () => {
      const script = `
        let x = 1
        fun foo() do
          let x = 99
        end
        foo()
        x
      `;
      expect(run(script)).toBe(1);
    });

    it("bare write inside a function rebinds the let on subsequent writes", () => {
      const script = `
        fun foo() do
          let x = 1
          let x = 2
          return x
        end
        foo()
      `;
      expect(run(script)).toBe(2);
    });

    it("let shadows an variable", () => {
      const script = `
        let x = 1
        fun foo() do
          let x = 99
        end
        foo()
        x
      `;
      expect(run(script)).toBe(1);
    });

    it("let can shadow a builtin inside a function", () => {
      const script = `
        fun foo() do
          let print = "shadowed"
          return print
        end
        foo()
      `;
      expect(run(script)).toBe("shadowed");
    });

    it("duplicate let in the same scope rebinds silently", () => {
      const script = `
        fun foo() do
          let x = 1
          let x = 2
          return x
        end
        foo()
      `;
      expect(run(script)).toBe(2);
    });

    it("mutates the top-level binding", () => {
      const script = `
        let x = 1
        fun foo() do
          x = 99
        end
        foo()
        x
      `;
      expect(run(script)).toBe(99);
    });

    it("raises NameError when no enclosing binding exists", () => {
      expect(() => run("fun foo() do\n  y = 1\nend\nfoo()")).toThrow(NameError);
    });

    it("if and while bodies do not introduce a new scope", () => {
      const script = `
        let x = 0
        if x == 0 then
          let y = 7
        end
        y
      `;
      expect(run(script)).toBe(7);
    });

    it("reads still walk the full scope chain", () => {
      const script = `
        let x = 1
        fun foo() do
          return x
        end
        foo()
      `;
      expect(run(script)).toBe(1);
    });

    it("builtins cannot be mutated without declaration", () => {
      expect(() => run(`fun foo() do\n  print = "nope"\nend\nfoo()`)).toThrow(
        NameError,
      );
    });

    it("read before a later let declaration sees the binding", () => {
      const symbolTable = new SymbolTable();
      const script = `
        let x = 1
        fun foo() do
          let result = x
          let x = 2
          return result
        end
        foo()
      `;
      expect(run(script, symbolTable)).toBe(1);
    });
  });

  describe("break statement", () => {
    it("exits a while(true) loop on first iteration", () => {
      const scope = new SymbolTable();
      run(
        `
        let count = 0
        while true do
          let count = count + 1
          break
        end
      `,
        scope,
      );
      expect(scope.lookup("count")).toEqual(new LuckyNumber(1));
    });

    it("exits loop when condition on break is met", () => {
      const scope = new SymbolTable();
      run(
        `
        let i = 0
        while true do
          if i == 5 then
            break
          end
          let i = i + 1
        end
        let after = i
      `,
        scope,
      );
      expect(scope.lookup("after")).toEqual(new LuckyNumber(5));
    });

    it("continues execution after the loop when break exits", () => {
      const scope = new SymbolTable();
      run(
        `
        let i = 0
        while true do
          break
        end
        let after = 42
      `,
        scope,
      );
      expect(scope.lookup("after")).toEqual(new LuckyNumber(42));
    });

    it("inner break exits only the inner loop; loop continues", () => {
      const scope = new SymbolTable();
      run(
        `
        let outerCount = 0
        let i = 0
        while i < 3 do
          let i = i + 1
          let outerCount = outerCount + 1
          let j = 0
          while true do
            let j = j + 1
            break
          end
        end
      `,
        scope,
      );
      expect(scope.lookup("outerCount")).toEqual(new LuckyNumber(3));
    });

    it("statements after break in the same block do not execute", () => {
      const scope = new SymbolTable();
      run(
        `
        let sideEffect = 0
        while true do
          break
          let sideEffect = 99
        end
      `,
        scope,
      );
      expect(scope.lookup("sideEffect")).toEqual(new LuckyNumber(0));
    });
  });

  describe("continue statement", () => {
    it("skips the rest of the iteration when continue runs", () => {
      const scope = new SymbolTable();
      run(
        `
        let i = 0
        let sideEffect = 0
        while i < 5 do
          let i = i + 1
          if i == 3 then
            continue
          end
          let sideEffect = sideEffect + 1
        end
      `,
        scope,
      );
      expect(scope.lookup("sideEffect")).toEqual(new LuckyNumber(4));
    });

    it("loop whose body unconditionally continues terminates when condition becomes false", () => {
      const scope = new SymbolTable();
      run(
        `
        let i = 0
        let sideEffect = 0
        while i < 5 do
          let i = i + 1
          continue
          let sideEffect = sideEffect + 1
        end
      `,
        scope,
      );
      expect(scope.lookup("i")).toEqual(new LuckyNumber(5));
      expect(scope.lookup("sideEffect")).toEqual(new LuckyNumber(0));
    });

    it("inner continue skips only the inner iteration; loop is unaffected", () => {
      const scope = new SymbolTable();
      run(
        `
        let outerCount = 0
        let i = 0
        while i < 3 do
          let i = i + 1
          let outerCount = outerCount + 1
          let j = 0
          while j < 3 do
            let j = j + 1
            if j == 2 then
              continue
            end
          end
        end
      `,
        scope,
      );
      expect(scope.lookup("outerCount")).toEqual(new LuckyNumber(3));
    });
  });

  describe("short-form lambda", () => {
    it("returns the result of a single expression", () => {
      const script = `
        let double = fun(x) x * 2
        double(3)
      `;
      expect(run(script)).toBe(6);
    });

    it("works with multiple parameters", () => {
      const script = `
        let add = fun(a, b) a + b
        add(1, 2)
      `;
      expect(run(script)).toBe(3);
    });

    it("full-form function without return returns nothing", () => {
      const script = `
        fun foo() do
          1 + 2
        end
        foo()
      `;
      expect(run(script)).toBe(undefined);
    });

    it("short-form lambda as argument", () => {
      const script = `
        fun apply(f, x) do
          return f(x)
        end
        apply(fun(x) x * 2, 5)
      `;
      expect(run(script)).toBe(10);
    });
  });
});
