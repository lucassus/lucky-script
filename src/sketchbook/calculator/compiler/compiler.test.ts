import { describe, expect, expectTypeOf, it, test } from "vitest";

import { parse } from "../parser";
import { run } from "../vm";
import type { BytecodeModule, Instruction } from "./index";
import { compile } from "./index";

function compiledMain(source: string): Instruction[] {
  return compile(parse(source)).main.code;
}

function compiledModule(source: string): BytecodeModule {
  return compile(parse(source));
}

test("empty program compiles to a single HALT", () => {
  expect(compiledMain("")).toEqual([{ opcode: "HALT" }]);
});

test("(1 + 2) * -3 compiles to expected bytecode", () => {
  const bytecode = compiledMain("(1 + 2) * -3");
  expectTypeOf(bytecode).toMatchTypeOf<Instruction[]>();

  const expected: Instruction[] = [
    { opcode: "PUSH", value: 1 },
    { opcode: "PUSH", value: 2 },
    { opcode: "ADD" },
    { opcode: "PUSH", value: 3 },
    { opcode: "NEG" },
    { opcode: "MUL" },
    { opcode: "HALT" },
  ];

  expect<Instruction[]>(bytecode).toEqual(expected);
});

test("x = 10 + 2 compiles to DUP and STORE_G", () => {
  expect(compiledMain("x = 10 + 2")).toEqual([
    { opcode: "PUSH", value: 10 },
    { opcode: "PUSH", value: 2 },
    { opcode: "ADD" },
    { opcode: "DUP" },
    { opcode: "STORE_G", name: "x" },
    { opcode: "HALT" },
  ]);
});

test("x = y = 2 compiles to nested DUP+STORE_G (right-associative)", () => {
  expect(compiledMain("x = y = 2")).toEqual([
    { opcode: "PUSH", value: 2 },
    { opcode: "DUP" },
    { opcode: "STORE_G", name: "y" },
    { opcode: "DUP" },
    { opcode: "STORE_G", name: "x" },
    { opcode: "HALT" },
  ]);
});

test.each<{ source: string; expected: Instruction[] }>([
  {
    source: "9",
    expected: [{ opcode: "PUSH", value: 9 }, { opcode: "HALT" }],
  },
  {
    source: "2.5",
    expected: [{ opcode: "PUSH", value: 2.5 }, { opcode: "HALT" }],
  },
  {
    source: "-4",
    expected: [
      { opcode: "PUSH", value: 4 },
      { opcode: "NEG" },
      { opcode: "HALT" },
    ],
  },
  {
    source: "-(-1)",
    expected: [
      { opcode: "PUSH", value: 1 },
      { opcode: "NEG" },
      { opcode: "NEG" },
      { opcode: "HALT" },
    ],
  },
  {
    source: "+8",
    expected: [{ opcode: "PUSH", value: 8 }, { opcode: "HALT" }],
  },
  {
    source: "5-2",
    expected: [
      { opcode: "PUSH", value: 5 },
      { opcode: "PUSH", value: 2 },
      { opcode: "SUB" },
      { opcode: "HALT" },
    ],
  },
  {
    source: "8/2",
    expected: [
      { opcode: "PUSH", value: 8 },
      { opcode: "PUSH", value: 2 },
      { opcode: "DIV" },
      { opcode: "HALT" },
    ],
  },
  {
    source: "2+3*4",
    expected: [
      { opcode: "PUSH", value: 2 },
      { opcode: "PUSH", value: 3 },
      { opcode: "PUSH", value: 4 },
      { opcode: "MUL" },
      { opcode: "ADD" },
      { opcode: "HALT" },
    ],
  },
  {
    source: "(2+3)*4",
    expected: [
      { opcode: "PUSH", value: 2 },
      { opcode: "PUSH", value: 3 },
      { opcode: "ADD" },
      { opcode: "PUSH", value: 4 },
      { opcode: "MUL" },
      { opcode: "HALT" },
    ],
  },
  {
    source: "10-3-2",
    expected: [
      { opcode: "PUSH", value: 10 },
      { opcode: "PUSH", value: 3 },
      { opcode: "SUB" },
      { opcode: "PUSH", value: 2 },
      { opcode: "SUB" },
      { opcode: "HALT" },
    ],
  },
  {
    source: "12/3/2",
    expected: [
      { opcode: "PUSH", value: 12 },
      { opcode: "PUSH", value: 3 },
      { opcode: "DIV" },
      { opcode: "PUSH", value: 2 },
      { opcode: "DIV" },
      { opcode: "HALT" },
    ],
  },
  {
    source: "1+1\n3*4",
    expected: [
      { opcode: "PUSH", value: 1 },
      { opcode: "PUSH", value: 1 },
      { opcode: "ADD" },
      { opcode: "POP" },
      { opcode: "PUSH", value: 3 },
      { opcode: "PUSH", value: 4 },
      { opcode: "MUL" },
      { opcode: "HALT" },
    ],
  },
])("compile(%j) matches bytecode snapshot", ({ source, expected }) => {
  expect(compiledMain(source)).toEqual(expected);
});

test.each<{ source: string; opcode: string }>([
  { source: "3 > 2", opcode: "GT" },
  { source: "3 < 2", opcode: "LT" },
  { source: "3 >= 2", opcode: "GTE" },
  { source: "3 <= 2", opcode: "LTE" },
  { source: "3 == 2", opcode: "EQ" },
  { source: "3 != 2", opcode: "NEQ" },
])("$source compiles to PUSH, PUSH, $opcode", ({ source, opcode }) => {
  expect(compiledMain(source)).toEqual([
    { opcode: "PUSH", value: 3 },
    { opcode: "PUSH", value: 2 },
    { opcode },
    { opcode: "HALT" },
  ]);
});

test("1 and 1 compiles to DUP, JMP_IF_ZERO, POP", () => {
  expect(compiledMain("1 and 1")).toEqual([
    { opcode: "PUSH", value: 1 },
    { opcode: "DUP" },
    { opcode: "JMP_IF_ZERO", target: 5 },
    { opcode: "POP" },
    { opcode: "PUSH", value: 1 },
    { opcode: "HALT" },
  ]);
});

test("1 or 0 compiles to DUP, NOT, JMP_IF_ZERO, POP", () => {
  expect(compiledMain("1 or 0")).toEqual([
    { opcode: "PUSH", value: 1 },
    { opcode: "DUP" },
    { opcode: "NOT" },
    { opcode: "JMP_IF_ZERO", target: 6 },
    { opcode: "POP" },
    { opcode: "PUSH", value: 0 },
    { opcode: "HALT" },
  ]);
});

test("not x compiles to LOAD_G, NOT", () => {
  expect(compiledMain("not x")).toEqual([
    { opcode: "LOAD_G", name: "x" },
    { opcode: "NOT" },
    { opcode: "HALT" },
  ]);
});

test("a and (b or c) compiles correctly", () => {
  expect(compiledMain("a and (b or c)")).toEqual([
    { opcode: "LOAD_G", name: "a" },
    { opcode: "DUP" },
    { opcode: "JMP_IF_ZERO", target: 10 },
    { opcode: "POP" },
    { opcode: "LOAD_G", name: "b" },
    { opcode: "DUP" },
    { opcode: "NOT" },
    { opcode: "JMP_IF_ZERO", target: 10 },
    { opcode: "POP" },
    { opcode: "LOAD_G", name: "c" },
    { opcode: "HALT" },
  ]);
});

test("logical 'and' short-circuits", () => {
  // If short-circuited, x = 1 is not executed
  const bytecode = compiledModule(`
    x = 0
    0 and (x = 1)
    x
  `);
  expect(run(bytecode)).toBe(0);
});

describe("loops", () => {
  it("compiles while loop", () => {
    expect(
      compile([
        {
          kind: "WhileStmt",
          span: { start: 0, end: 0 },
          condition: {
            kind: "Compare",
            op: ">",
            span: { start: 0, end: 0 },
            left: { kind: "Identifier", name: "x", span: { start: 0, end: 0 } },
            right: { kind: "Literal", value: 0, span: { start: 0, end: 0 } },
          },
          body: [
            {
              kind: "ExprStmt",
              span: { start: 0, end: 0 },
              expr: {
                kind: "Assign",
                name: "x",
                span: { start: 0, end: 0 },
                value: {
                  kind: "Arithmetic",
                  op: "-",
                  span: { start: 0, end: 0 },
                  left: {
                    kind: "Identifier",
                    name: "x",
                    span: { start: 0, end: 0 },
                  },
                  right: {
                    kind: "Literal",
                    value: 1,
                    span: { start: 0, end: 0 },
                  },
                },
              },
            },
          ],
        },
      ]).main.code,
    ).toEqual([
      { opcode: "LOAD_G", name: "x" },
      { opcode: "PUSH", value: 0 },
      { opcode: "GT" },
      { opcode: "JMP_IF_ZERO", target: 11 },
      { opcode: "LOAD_G", name: "x" },
      { opcode: "PUSH", value: 1 },
      { opcode: "SUB" },
      { opcode: "DUP" },
      { opcode: "STORE_G", name: "x" },
      { opcode: "POP" }, // Pop the result of the expression statement
      { opcode: "JMP", target: 0 },
      { opcode: "HALT" },
    ]);
  });

  it("compiles break and continue", () => {
    expect(
      compile([
        {
          kind: "WhileStmt",
          span: { start: 0, end: 0 },
          condition: { kind: "Literal", value: 1, span: { start: 0, end: 0 } },
          body: [
            { kind: "BreakStmt", span: { start: 0, end: 0 } },
            { kind: "ContinueStmt", span: { start: 0, end: 0 } },
          ],
        },
      ]).main.code,
    ).toEqual([
      { opcode: "PUSH", value: 1 },
      { opcode: "JMP_IF_ZERO", target: 5 },
      { opcode: "JMP", target: 5 }, // break
      { opcode: "JMP", target: 0 }, // continue
      { opcode: "JMP", target: 0 }, // loop end jump
      { opcode: "HALT" },
    ]);
  });

  it("throws error for break outside loop", () => {
    expect(() =>
      compile([{ kind: "BreakStmt", span: { start: 0, end: 0 } }]),
    ).toThrowError("break statement outside of a loop");
  });

  it("throws error for continue outside loop", () => {
    expect(() =>
      compile([{ kind: "ContinueStmt", span: { start: 0, end: 0 } }]),
    ).toThrowError("continue statement outside of a loop");
  });
});

test("logical 'or' short-circuits", () => {
  // If short-circuited, x = 1 is not executed
  const bytecode = compiledModule(`
    x = 0
    1 or (x = 1)
    x
  `);
  expect(run(bytecode)).toBe(0);
});

test("logical 'and' returns actual values", () => {
  expect(run(compiledModule("2 and 3"))).toBe(3);
  expect(run(compiledModule("0 and 3"))).toBe(0);
});

test("logical 'or' returns actual values", () => {
  expect(run(compiledModule("2 or 3"))).toBe(2);
  expect(run(compiledModule("0 or 3"))).toBe(3);
});

test("comparison with arithmetic operands: x + 1 > 0", () => {
  expect(compiledMain("x + 1 > 0")).toEqual([
    { opcode: "LOAD_G", name: "x" },
    { opcode: "PUSH", value: 1 },
    { opcode: "ADD" },
    { opcode: "PUSH", value: 0 },
    { opcode: "GT" },
    { opcode: "HALT" },
  ]);
});

test("if: JMP_IF_ZERO around body", () => {
  expect(compiledMain("if 1 > 0\nx = 1\nend")).toEqual([
    { opcode: "PUSH", value: 1 },
    { opcode: "PUSH", value: 0 },
    { opcode: "GT" },
    { opcode: "JMP_IF_ZERO", target: 8 },
    { opcode: "PUSH", value: 1 },
    { opcode: "DUP" },
    { opcode: "STORE_G", name: "x" },
    { opcode: "POP" },
    { opcode: "HALT" },
  ]);
});

test("if elseif else", () => {
  expect(
    compiledMain(`
    if x > 2
      x = 2
    elseif x > 1
    else
      x = 3
    end
    
    x
  `),
  ).toEqual<Instruction[]>([
    { opcode: "LOAD_G", name: "x" },
    { opcode: "PUSH", value: 2 },
    { opcode: "GT" },
    { opcode: "JMP_IF_ZERO", target: 9 },
    // if x > 2
    { opcode: "PUSH", value: 2 },
    { opcode: "DUP" },
    { opcode: "STORE_G", name: "x" },
    { opcode: "POP" },
    { opcode: "JMP", target: 18 },
    // elseif x > 1
    { opcode: "LOAD_G", name: "x" },
    { opcode: "PUSH", value: 1 },
    { opcode: "GT" },
    { opcode: "JMP_IF_ZERO", target: 14 },
    { opcode: "JMP", target: 18 },
    // else
    { opcode: "PUSH", value: 3 },
    { opcode: "DUP" },
    { opcode: "STORE_G", name: "x" },
    { opcode: "POP" },

    { opcode: "LOAD_G", name: "x" },
    { opcode: "HALT" },
  ]);
});

test("if false skips body", () => {
  const bytecode = compiledModule(`x = 0
if x > 0
x = 2
end
x`);
  expect(run(bytecode)).toBe(0);
});

test("if true runs body", () => {
  const bytecode = compiledModule(`x = 1
if x > 0
x = 2
end
x`);
  expect(run(bytecode)).toBe(2);
});

test("if-elseif-else executes the 'if' branch", () => {
  const bytecode = compiledModule(`
    x = 0
    if 2 > 1
      x = 1
    elseif 2 > 1
      x = 2
    else
      x = 3
    end
    x
  `);
  expect(run(bytecode)).toBe(1);
});

test("if-elseif-else executes the 'elseif' branch", () => {
  const bytecode = compiledModule(`
    x = 0
    if 1 > 2
      x = 1
    elseif 2 > 1
      x = 2
    else
      x = 3
    end
    x
  `);
  expect(run(bytecode)).toBe(2);
});

test("if-elseif-else executes the 'else' branch", () => {
  const bytecode = compiledModule(`
    x = 0
    if 1 > 2
      x = 1
    elseif 1 > 2
      x = 2
    else
      x = 3
    end
    x
  `);
  expect(run(bytecode)).toBe(3);
});

test("function body: add with explicit return and implicit epilogue", () => {
  const m = compile(parse("def add(a, b)\nreturn a + b\nend"));
  expect(m.functions).toHaveLength(1);
  expect(m.functions[0]!.code).toEqual([
    { opcode: "LOAD_L", name: "a" },
    { opcode: "LOAD_L", name: "b" },
    { opcode: "ADD" },
    { opcode: "RETURN" },
    { opcode: "PUSH", value: 0 },
    { opcode: "RETURN" },
  ]);
});

test("function body: local assignment then return", () => {
  const m = compile(parse("def f(a)\nx = a + 1\nreturn x\nend"));
  expect(m.functions[0]!.code).toEqual([
    { opcode: "LOAD_L", name: "a" },
    { opcode: "PUSH", value: 1 },
    { opcode: "ADD" },
    { opcode: "DUP" },
    { opcode: "STORE_L", name: "x" },
    { opcode: "POP" },
    { opcode: "LOAD_L", name: "x" },
    { opcode: "RETURN" },
    { opcode: "PUSH", value: 0 },
    { opcode: "RETURN" },
  ]);
});

test("two-pass forward reference: f calls g declared later", () => {
  const m = compile(
    parse(`def f()\nreturn g()\nend\ndef g()\nreturn 7\nend\nf()`),
  );
  expect(run(m)).toBe(7);
});

test.each<[string, string]>([
  ["def dup()\nend\ndef dup()\nend", "duplicate function"],
  ["return 1", "return outside of a function"],
  ["if 1\ndef f()\nend\nend", "def is only allowed at the top level"],
  [
    `
def f()
  return x
end
x = 1
f()
`,
    "unknown name",
  ],
  ["nosuch()", "unknown function"],
  ["def g(a)\nend\ng()", "arity mismatch"],
])("compile error: %s", (source, msg) => {
  expect(() => compile(parse(source.trim()))).toThrow(msg);
});
