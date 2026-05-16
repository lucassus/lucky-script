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

/** Extract a number from a run result; throws if the result is a closure. */
function numResult(mod: BytecodeModule): number | undefined {
  const v = run(mod);
  if (v === undefined) return undefined;
  if (v.kind !== "number") throw new Error("expected number result");
  return v.value;
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

// let x = e is a statement (no DUP, no expression value left on stack).
test("let x = 10 + 2 compiles to DEFINE (no DUP)", () => {
  expect(compiledMain("let x = 10 + 2")).toEqual([
    { opcode: "PUSH", value: 10 },
    { opcode: "PUSH", value: 2 },
    { opcode: "ADD" },
    { opcode: "DEFINE", name: "x" },
    { opcode: "HALT" },
  ]);
});

// Bare x = e leaves a value on the stack (expression), so it gets DUP + ASSIGN.
// Chained x = y = 2 requires both to be pre-defined.
test("x = y = 2 compiles to nested DUP+ASSIGN (right-associative)", () => {
  expect(compiledMain("let x = 0\nlet y = 0\nx = y = 2")).toEqual([
    { opcode: "PUSH", value: 0 },
    { opcode: "DEFINE", name: "x" },
    { opcode: "PUSH", value: 0 },
    { opcode: "DEFINE", name: "y" },
    { opcode: "PUSH", value: 2 },
    { opcode: "DUP" },
    { opcode: "ASSIGN", name: "y" },
    { opcode: "DUP" },
    { opcode: "ASSIGN", name: "x" },
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

// let x uses DEFINE (no DUP); x that is read via LOAD "x".
test("not x compiles to LOAD, NOT", () => {
  expect(compiledMain("let x = 0\nnot x")).toEqual([
    { opcode: "PUSH", value: 0 },
    { opcode: "DEFINE", name: "x" },
    { opcode: "LOAD", name: "x" },
    { opcode: "NOT" },
    { opcode: "HALT" },
  ]);
});

// All three vars use DEFINE; logical ops read them via LOAD.
test("a and (b or c) compiles correctly", () => {
  expect(
    compiledMain("let a = 1\nlet b = 0\nlet c = 1\na and (b or c)"),
  ).toEqual([
    { opcode: "PUSH", value: 1 },
    { opcode: "DEFINE", name: "a" },
    { opcode: "PUSH", value: 0 },
    { opcode: "DEFINE", name: "b" },
    { opcode: "PUSH", value: 1 },
    { opcode: "DEFINE", name: "c" },
    { opcode: "LOAD", name: "a" },
    { opcode: "DUP" },
    { opcode: "JMP_IF_ZERO", target: 16 },
    { opcode: "POP" },
    { opcode: "LOAD", name: "b" },
    { opcode: "DUP" },
    { opcode: "NOT" },
    { opcode: "JMP_IF_ZERO", target: 16 },
    { opcode: "POP" },
    { opcode: "LOAD", name: "c" },
    { opcode: "HALT" },
  ]);
});

test("logical 'and' short-circuits", () => {
  const bytecode = compiledModule(`
    let x = 0
    0 and (x = 1)
    x
  `);
  expect(numResult(bytecode)).toBe(0);
});

describe("loops", () => {
  it("compiles while loop", () => {
    expect(
      compile([
        // `let x = 1` defines x in the current scope via DEFINE.
        {
          kind: "LetStmt" as const,
          span: { start: 0, end: 0 },
          name: "x",
          value: { kind: "Literal", value: 1, span: { start: 0, end: 0 } },
        },
        {
          kind: "WhileStmt" as const,
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
              kind: "ExprStmt" as const,
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
      { opcode: "PUSH", value: 1 },
      { opcode: "DEFINE", name: "x" }, // let x = 1 — no DUP needed
      { opcode: "LOAD", name: "x" }, // loopStart = 2
      { opcode: "PUSH", value: 0 },
      { opcode: "GT" },
      { opcode: "JMP_IF_ZERO", target: 13 },
      { opcode: "LOAD", name: "x" },
      { opcode: "PUSH", value: 1 },
      { opcode: "SUB" },
      { opcode: "DUP" },
      { opcode: "ASSIGN", name: "x" }, // bare x = e uses ASSIGN
      { opcode: "POP" },
      { opcode: "JMP", target: 2 },
      { opcode: "HALT" }, // loopEnd = 13
    ]);
  });

  it("compiles break and continue", () => {
    expect(
      compile([
        {
          kind: "WhileStmt" as const,
          span: { start: 0, end: 0 },
          condition: { kind: "Literal", value: 1, span: { start: 0, end: 0 } },
          body: [
            { kind: "BreakStmt" as const, span: { start: 0, end: 0 } },
            { kind: "ContinueStmt" as const, span: { start: 0, end: 0 } },
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
      compile([{ kind: "BreakStmt" as const, span: { start: 0, end: 0 } }]),
    ).toThrowError("break statement outside of a loop");
  });

  it("throws error for continue outside loop", () => {
    expect(() =>
      compile([{ kind: "ContinueStmt" as const, span: { start: 0, end: 0 } }]),
    ).toThrowError("continue statement outside of a loop");
  });
});

test("logical 'or' short-circuits", () => {
  const bytecode = compiledModule(`
    let x = 0
    1 or (x = 1)
    x
  `);
  expect(numResult(bytecode)).toBe(0);
});

test("logical 'and' returns actual values", () => {
  expect(numResult(compiledModule("2 and 3"))).toBe(3);
  expect(numResult(compiledModule("0 and 3"))).toBe(0);
});

test("logical 'or' returns actual values", () => {
  expect(numResult(compiledModule("2 or 3"))).toBe(2);
  expect(numResult(compiledModule("0 or 3"))).toBe(3);
});

// Compares against 0 — let defines x; LOAD reads it.
test("comparison with arithmetic operands: x + 1 > 0", () => {
  expect(compiledMain("let x = 0\nx + 1 > 0")).toEqual([
    { opcode: "PUSH", value: 0 },
    { opcode: "DEFINE", name: "x" },
    { opcode: "LOAD", name: "x" },
    { opcode: "PUSH", value: 1 },
    { opcode: "ADD" },
    { opcode: "PUSH", value: 0 },
    { opcode: "GT" },
    { opcode: "HALT" },
  ]);
});

// let x uses DEFINE; inside if body x = 1 uses ASSIGN.
test("if: JMP_IF_ZERO around body", () => {
  expect(compiledMain("if 1 > 0\nlet x = 1\nend")).toEqual([
    { opcode: "PUSH", value: 1 },
    { opcode: "PUSH", value: 0 },
    { opcode: "GT" },
    { opcode: "JMP_IF_ZERO", target: 6 },
    { opcode: "PUSH", value: 1 },
    { opcode: "DEFINE", name: "x" },
    { opcode: "HALT" },
  ]);
});

test("if elseif else", () => {
  expect(
    compiledMain(`
    let x = 3
    if x > 2
      x = 2
    elseif x > 1
    else
      x = 3
    end

    x
  `),
  ).toEqual<Instruction[]>([
    { opcode: "PUSH", value: 3 },
    { opcode: "DEFINE", name: "x" },
    { opcode: "LOAD", name: "x" },
    { opcode: "PUSH", value: 2 },
    { opcode: "GT" },
    { opcode: "JMP_IF_ZERO", target: 11 },
    // if x > 2
    { opcode: "PUSH", value: 2 },
    { opcode: "DUP" },
    { opcode: "ASSIGN", name: "x" },
    { opcode: "POP" },
    { opcode: "JMP", target: 20 },
    // elseif x > 1
    { opcode: "LOAD", name: "x" },
    { opcode: "PUSH", value: 1 },
    { opcode: "GT" },
    { opcode: "JMP_IF_ZERO", target: 16 },
    { opcode: "JMP", target: 20 },
    // else
    { opcode: "PUSH", value: 3 },
    { opcode: "DUP" },
    { opcode: "ASSIGN", name: "x" },
    { opcode: "POP" },

    { opcode: "LOAD", name: "x" },
    { opcode: "HALT" },
  ]);
});

test("if false skips body", () => {
  const bytecode = compiledModule(`let x = 0
if x > 0
let x = 2
end
x`);
  expect(numResult(bytecode)).toBe(0);
});

test("if true runs body", () => {
  const bytecode = compiledModule(`let x = 1
if x > 0
x = 2
end
x`);
  expect(numResult(bytecode)).toBe(2);
});

test("if-elseif-else executes the 'if' branch", () => {
  const bytecode = compiledModule(`
    let x = 0
    if 2 > 1
      x = 1
    elseif 2 > 1
      x = 2
    else
      x = 3
    end
    x
  `);
  expect(numResult(bytecode)).toBe(1);
});

test("if-elseif-else executes the 'elseif' branch", () => {
  const bytecode = compiledModule(`
    let x = 0
    if 1 > 2
      x = 1
    elseif 2 > 1
      x = 2
    else
      x = 3
    end
    x
  `);
  expect(numResult(bytecode)).toBe(2);
});

test("if-elseif-else executes the 'else' branch", () => {
  const bytecode = compiledModule(`
    let x = 0
    if 1 > 2
      x = 1
    elseif 1 > 2
      x = 2
    else
      x = 3
    end
    x
  `);
  expect(numResult(bytecode)).toBe(3);
});

// Function body bytecode is unchanged (params implicitly define via CALL).
test("function body: add with explicit return and implicit epilogue", () => {
  const m = compile(parse("def add(a, b)\nreturn a + b\nend"));
  expect(m.functions).toHaveLength(1);
  expect(m.functions[0]!.code).toEqual([
    { opcode: "LOAD", name: "a" },
    { opcode: "LOAD", name: "b" },
    { opcode: "ADD" },
    { opcode: "RETURN" },
    { opcode: "PUSH", value: 0 },
    { opcode: "RETURN" },
  ]);
});

// Local variable `x` must be declared with `let` inside the function body.
test("function body: local let then return", () => {
  const m = compile(parse("def f(a)\nlet x = a + 1\nreturn x\nend"));
  expect(m.functions[0]!.code).toEqual([
    { opcode: "LOAD", name: "a" },
    { opcode: "PUSH", value: 1 },
    { opcode: "ADD" },
    { opcode: "DEFINE", name: "x" }, // let x — no DUP, not an expression
    { opcode: "LOAD", name: "x" },
    { opcode: "RETURN" },
    { opcode: "PUSH", value: 0 },
    { opcode: "RETURN" },
  ]);
});

// With no hoisting, g must be defined before f's body is compiled.
test("forward reference to g from f's body is a compile error without hoisting", () => {
  expect(() =>
    compile(parse(`def f()\nreturn g()\nend\ndef g()\nreturn 7\nend\nf()`)),
  ).toThrow("unknown name");
});

// Define g before f to satisfy the define-before-use rule.
test("define-before-use: g defined before f can call it", () => {
  const m = compile(
    parse(`def g()\nreturn 7\nend\ndef f()\nreturn g()\nend\nf()`),
  );
  expect(numResult(m)).toBe(7);
});

test.each<[string, string]>([
  ["def dup()\nend\ndef dup()\nend", "duplicate function"],
  ["return 1", "return outside of a function"],
  [
    `
def f()
  return x
end
let x = 1
f()
`,
    "unknown name",
  ],
  // nosuch() is not a known name (not defined with let or def)
  ["nosuch()", "unknown name"],
])("compile error: %s", (source, msg) => {
  expect(() => compile(parse(source.trim()))).toThrow(msg);
});

// Arity mismatch is now a runtime error (arity is only known at call time).
test("arity mismatch is a runtime error", () => {
  expect(() => run(compile(parse("def g(a)\nreturn a\nend\ng()")))).toThrow(
    "arity mismatch",
  );
});
