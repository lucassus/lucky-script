import { expect, expectTypeOf, test } from "vitest";

import { parse } from "../parser";
import { run } from "../vm";
import type { Bytecode, Instruction } from "./index";
import { compile } from "./index";

function compiled(source: string): Bytecode {
  return compile(parse(source));
}

test("empty program compiles to a single HALT", () => {
  expect(compiled("")).toEqual([{ opcode: "HALT" }]);
});

test("(1 + 2) * -3 compiles to expected bytecode", () => {
  const bytecode = compiled("(1 + 2) * -3");
  expectTypeOf(bytecode).toMatchTypeOf<Bytecode>();

  const expected: Bytecode = [
    { opcode: "PUSH", value: 1 },
    { opcode: "PUSH", value: 2 },
    { opcode: "ADD" },
    { opcode: "PUSH", value: 3 },
    { opcode: "NEG" },
    { opcode: "MUL" },
    { opcode: "HALT" },
  ];

  expect<Bytecode>(bytecode).toEqual(expected);
});

test("x = 10 + 2 compiles to DUP and STORE", () => {
  expect(compiled("x = 10 + 2")).toEqual([
    { opcode: "PUSH", value: 10 },
    { opcode: "PUSH", value: 2 },
    { opcode: "ADD" },
    { opcode: "DUP" },
    { opcode: "STORE", name: "x" },
    { opcode: "HALT" },
  ]);
});

test("x = y = 2 compiles to nested DUP+STORE (right-associative)", () => {
  expect(compiled("x = y = 2")).toEqual([
    { opcode: "PUSH", value: 2 },
    { opcode: "DUP" },
    { opcode: "STORE", name: "y" },
    { opcode: "DUP" },
    { opcode: "STORE", name: "x" },
    { opcode: "HALT" },
  ]);
});

test.each<{ source: string; expected: Bytecode }>([
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
  expect(compiled(source)).toEqual(expected);
});

test.each<{ source: string; opcode: string }>([
  { source: "3 > 2", opcode: "GT" },
  { source: "3 < 2", opcode: "LT" },
  { source: "3 >= 2", opcode: "GTE" },
  { source: "3 <= 2", opcode: "LTE" },
  { source: "3 == 2", opcode: "EQ" },
  { source: "3 != 2", opcode: "NEQ" },
])("$source compiles to PUSH, PUSH, $opcode", ({ source, opcode }) => {
  expect(compiled(source)).toEqual([
    { opcode: "PUSH", value: 3 },
    { opcode: "PUSH", value: 2 },
    { opcode },
    { opcode: "HALT" },
  ]);
});

test("1 and 1 compiles to PUSH, PUSH, AND", () => {
  expect(compiled("1 and 1")).toEqual([
    { opcode: "PUSH", value: 1 },
    { opcode: "PUSH", value: 1 },
    { opcode: "AND" },
    { opcode: "HALT" },
  ]);
});

test("1 or 0 compiles to PUSH, PUSH, OR", () => {
  expect(compiled("1 or 0")).toEqual([
    { opcode: "PUSH", value: 1 },
    { opcode: "PUSH", value: 0 },
    { opcode: "OR" },
    { opcode: "HALT" },
  ]);
});

test("not x compiles to LOAD, NOT", () => {
  expect(compiled("not x")).toEqual([
    { opcode: "LOAD", name: "x" },
    { opcode: "NOT" },
    { opcode: "HALT" },
  ]);
});

test("a and (b or c) compiles correctly", () => {
  expect(compiled("a and (b or c)")).toEqual([
    { opcode: "LOAD", name: "a" },
    { opcode: "LOAD", name: "b" },
    { opcode: "LOAD", name: "c" },
    { opcode: "OR" },
    { opcode: "AND" },
    { opcode: "HALT" },
  ]);
});

test("comparison with arithmetic operands: x + 1 > 0", () => {
  expect(compiled("x + 1 > 0")).toEqual([
    { opcode: "LOAD", name: "x" },
    { opcode: "PUSH", value: 1 },
    { opcode: "ADD" },
    { opcode: "PUSH", value: 0 },
    { opcode: "GT" },
    { opcode: "HALT" },
  ]);
});

test("if: JMP_IF_ZERO around body", () => {
  expect(compiled("if 1 > 0\nx = 1\nend")).toEqual([
    { opcode: "PUSH", value: 1 },
    { opcode: "PUSH", value: 0 },
    { opcode: "GT" },
    { opcode: "JMP_IF_ZERO", target: 8 },
    { opcode: "PUSH", value: 1 },
    { opcode: "DUP" },
    { opcode: "STORE", name: "x" },
    { opcode: "POP" },
    { opcode: "HALT" },
  ]);
});

test("if elseif else", () => {
  expect(
    compiled(`
    if x > 2
      x = 2
    elseif x > 1
    else
      x = 3
    end
    
    x
  `),
  ).toEqual<Instruction[]>([
    { opcode: "LOAD", name: "x" },
    { opcode: "PUSH", value: 2 },
    { opcode: "GT" },
    { opcode: "JMP_IF_ZERO", target: 9 },
    // if x > 2
    { opcode: "PUSH", value: 2 },
    { opcode: "DUP" },
    { opcode: "STORE", name: "x" },
    { opcode: "POP" },
    { opcode: "JMP", target: 18 },
    // elseif x > 1
    { opcode: "LOAD", name: "x" },
    { opcode: "PUSH", value: 1 },
    { opcode: "GT" },
    { opcode: "JMP_IF_ZERO", target: 14 },
    { opcode: "JMP", target: 18 },
    // else
    { opcode: "PUSH", value: 3 },
    { opcode: "DUP" },
    { opcode: "STORE", name: "x" },
    { opcode: "POP" },

    { opcode: "LOAD", name: "x" },
    { opcode: "HALT" },
  ]);
});

test("if false skips body", () => {
  const bytecode = compiled(`x = 0
if x > 0
x = 2
end
x`);
  expect(run(bytecode)).toBe(0);
});

test("if true runs body", () => {
  const bytecode = compiled(`x = 1
if x > 0
x = 2
end
x`);
  expect(run(bytecode)).toBe(2);
});

test("if-elseif-else executes the 'if' branch", () => {
  const bytecode = compiled(`
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
  const bytecode = compiled(`
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
  const bytecode = compiled(`
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
