import { describe, expect, test } from "vitest";

import { createGrammarRuntime } from "../grammar";
import { parse } from "../parse";
import { compile } from "./compile";
import { run } from "./vm";

function runCompiled(source: string): number {
  return run(compile(parse(source)));
}

describe("compile", () => {
  test("golden: 1 + 2", () => {
    const ast = parse("1 + 2");
    const module = compile(ast);
    const main = module.functions[0]!;
    expect(main.name).toBe("__main");
    expect(module.constants).toEqual([1, 2]);
    expect(main.code.map((i) => i.op)).toEqual([
      "CONST",
      "CONST",
      "ADD",
      "RETURN",
    ]);
  });

  test("golden: let x = 10; x", () => {
    const ast = parse(`
let x = 10
x
`);
    const module = compile(ast);
    expect(module.globals).toEqual(["x"]);
    expect(module.constants).toEqual([10]);
    const main = module.functions[0]!;
    expect(main.code.map((i) => i.op)).toEqual([
      "CONST",
      "STORE_G",
      "LOAD_G",
      "RETURN",
    ]);
  });

  test("golden: simple if / else", () => {
    const ast = parse(`
if 1 < 2 then
  10
else
  20
end
30
`);
    const module = compile(ast);
    expect(module.constants).toEqual([1, 2, 10, 20, 30]);
    const main = module.functions[0]!;
    expect(main.code.map((i) => i.op)).toEqual([
      "CONST",
      "CONST",
      "LT",
      "JUMP_IF_ZERO",
      "CONST",
      "POP",
      "JUMP",
      "CONST",
      "POP",
      "CONST",
      "RETURN",
    ]);
  });

  test("unsupported elseif", () => {
    const ast = parse(`
if 1 < 2 then
  1
elseif 2 < 3 then
  2
end
3
`);
    expect(() => compile(ast)).toThrow(/micro-vm compile:.*elseif/);
  });

  test("unsupported operators and literals", () => {
    expect(() => compile(parse("1 % 2"))).toThrow(/micro-vm compile:.*% /);
    expect(() => compile(parse("2 ^ 3"))).toThrow(/micro-vm compile:.*\^ /);
    expect(() => compile(parse("1 and 2"))).toThrow(/micro-vm compile:.*and/);
    expect(() => compile(parse("1 or 2"))).toThrow(/micro-vm compile:.*or/);
    expect(() => compile(parse("not 1"))).toThrow(/micro-vm compile:.*not/);
    expect(() => compile(parse("1 != 2"))).toThrow(/micro-vm compile:.*!=/);
    expect(() => compile(parse("1 <= 2"))).toThrow(/micro-vm compile:.*<=/);
    expect(() => compile(parse("1 >= 2"))).toThrow(/micro-vm compile:.*>=/);
    expect(() => compile(parse("1 > 2"))).toThrow(/micro-vm compile:.*>/);
    expect(() => compile(parse("+1"))).toThrow(/micro-vm compile:.*unary \+/);
    expect(() => compile(parse("-1"))).toThrow(/micro-vm compile:.*unary -/);
    expect(() => compile(parse("true"))).toThrow(
      /micro-vm compile:.*boolean literal/,
    );
    expect(() => compile(parse("false"))).toThrow(
      /micro-vm compile:.*boolean literal/,
    );
    expect(() => compile(parse("null"))).toThrow(
      /micro-vm compile:.*null literal/,
    );
  });

  test("golden: minimal fun plus top-level call ends with CALL then RETURN", () => {
    const ast = parse(`
fun id(n) do
  return n
end
id(7)
`);
    const module = compile(ast);
    const main = module.functions[0]!;
    const tail = main.code.slice(-2);
    expect(tail[0]?.op).toBe("CALL");
    expect(tail[1]?.op).toBe("RETURN");
  });

  test("forward reference: f calls g defined later", () => {
    const src = `
fun f() do
  return g()
end
fun g() do
  return 1
end
f()
`;
    expect(() => compile(parse(src))).not.toThrow();
    const { evaluate } = createGrammarRuntime();
    expect(evaluate(src)).toBe(1);
    expect(runCompiled(src)).toBe(1);
  });

  test("global fallback emits LOAD_G / STORE_G from function body", () => {
    const ast = parse(`
let x = 1
fun bump() do
  x = x + 1
  return 0
end
bump()
x
`);
    const module = compile(ast);
    const bump = module.functions.find((f) => f.name === "bump");
    expect(bump).toBeDefined();
    const ops = bump!.code.map((i) => i.op);
    expect(ops).toContain("LOAD_G");
    expect(ops).toContain("STORE_G");
  });

  test("unknown name", () => {
    expect(() => compile(parse("foo"))).toThrow(
      /micro-vm compile:.*unknown name/,
    );
  });
});
