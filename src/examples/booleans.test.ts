import { Lexer } from "../Lexer";
import { Parser } from "../Parser";
import { Interpreter } from "../Interpreter/Interpreter";

function run(script: string): undefined | boolean | number | string {
  const tokens = new Lexer(script).tokenize();
  const ast = new Parser(tokens).parse();
  return new Interpreter(ast).run();
}

describe("Boolean literals", () => {
  it.each`
    script     | expected
    ${"true"}  | ${true}
    ${"false"} | ${false}
  `("evaluates $script to $expected", ({ script, expected }) => {
    expect(run(script)).toBe(expected);
  });
});

describe("not operator", () => {
  it.each`
    script         | expected
    ${"not true"}  | ${false}
    ${"not false"} | ${true}
    ${"not 0"}     | ${true}
    ${"not 1"}     | ${false}
    ${"not -1"}    | ${false}
  `("evaluates $script to $expected", ({ script, expected }) => {
    expect(run(script)).toBe(expected);
  });
});

describe("and operator", () => {
  it.each`
    script              | expected
    ${"true and true"}  | ${true}
    ${"true and false"} | ${false}
    ${"false and true"} | ${false}
    ${"1 and 2"}        | ${true}
    ${"0 and true"}     | ${false}
  `("evaluates $script to $expected", ({ script, expected }) => {
    expect(run(script)).toBe(expected);
  });

  it("short-circuits: right side not evaluated when left is false", () => {
    // undeclaredFn() would throw RuntimeError if called
    expect(run("false and undeclaredFn()")).toBe(false);
  });
});

describe("operator precedence", () => {
  it("and binds tighter than or: true and false == false", () => {
    expect(run("true and false == false")).toBe(true);
  });
});

describe("or operator", () => {
  it.each`
    script              | expected
    ${"false or true"}  | ${true}
    ${"false or false"} | ${false}
    ${"0 or false"}     | ${false}
    ${"-1 or 0"}        | ${true}
  `("evaluates $script to $expected", ({ script, expected }) => {
    expect(run(script)).toBe(expected);
  });

  it("short-circuits: right side not evaluated when left is true", () => {
    // undeclaredFn() would throw RuntimeError if called
    expect(run("true or undeclaredFn()")).toBe(true);
  });
});

describe("if statement with boolean condition", () => {
  it.each`
    condition  | expected
    ${"true"}  | ${1}
    ${"false"} | ${0}
  `(
    "executes then-branch when condition is $condition",
    ({ condition, expected }) => {
      expect(
        run(`
        result = 0
        if (${condition}) {
          result = 1
        }
        result
      `),
      ).toBe(expected);
    },
  );

  it("executes else-branch when condition is false", () => {
    expect(
      run(`
        result = 0
        if (false) {
          result = 1
        } else {
          result = 2
        }
        result
      `),
    ).toBe(2);
  });

  it("uses boolean expression as condition", () => {
    expect(
      run(`
        result = 0
        if (1 > 0 and true) {
          result = 1
        }
        result
      `),
    ).toBe(1);
  });
});
