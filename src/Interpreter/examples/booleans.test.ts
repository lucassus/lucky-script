import { Lexer } from "../../Lexer";
import { Parser } from "../../Parser";
import { Interpreter } from "../Interpreter";

function run(script: string): undefined | boolean | number {
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

describe("or operator", () => {
  it.each`
    script                       | expected
    ${"false or true"}           | ${true}
    ${"false or false"}          | ${false}
    ${"0 or false"}              | ${false}
    ${"true and false == false"} | ${true}
    ${"-1 or 0"}                 | ${true}
  `("evaluates $script to $expected", ({ script, expected }) => {
    expect(run(script)).toBe(expected);
  });

  it("short-circuits: right side not evaluated when left is true", () => {
    // undeclaredFn() would throw RuntimeError if called
    expect(run("true or undeclaredFn()")).toBe(true);
  });
});
