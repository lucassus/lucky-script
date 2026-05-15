import { describe, expect, test } from "vitest";

import { createGrammarRuntime } from "../grammar";
import { parse } from "../parse";
import { compile } from "./compile";
import { run } from "./vm";

function vmEval(source: string): number {
  return run(compile(parse(source)));
}

describe("parity evaluate vs micro-vm", () => {
  test("small arithmetic", () => {
    const src = `1 + 2 * 3`;
    const { evaluate } = createGrammarRuntime();
    expect(vmEval(src)).toBe(evaluate(src));
  });

  test("let binding", () => {
    const src = `
let a = 5
a + 1
`;
    const { evaluate } = createGrammarRuntime();
    expect(vmEval(src)).toBe(evaluate(src));
  });

  test.each`
    n    | expected
    ${0} | ${0}
    ${1} | ${1}
    ${2} | ${1}
    ${3} | ${2}
    ${4} | ${3}
    ${5} | ${5}
    ${6} | ${8}
    ${7} | ${13}
    ${8} | ${21}
    ${9} | ${34}
  `("fibonacci recursive matches evaluate for n=$n", ({ n, expected }) => {
    const src = `
fun fib(n) do
  if n < 2 then
    return n
  end

  return fib(n - 2) + fib(n - 1)
end

fib(${n})
`;
    const { evaluate } = createGrammarRuntime();
    expect(vmEval(src)).toBe(expected);
    expect(vmEval(src)).toBe(evaluate(src));
  });

  test("if with else (trailing ExprStmt)", () => {
    const src = `
if 0 < 1 then
  10
else
  20
end
1
`;
    const { evaluate } = createGrammarRuntime();
    expect(vmEval(src)).toBe(evaluate(src));
  });

  test("if without else (trailing ExprStmt)", () => {
    const src = `
if 0 < 1 then
  5
end
1
`;
    const { evaluate } = createGrammarRuntime();
    expect(vmEval(src)).toBe(evaluate(src));
  });
});
