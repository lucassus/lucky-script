import { expect, expectTypeOf, test } from "vitest";

import { parse } from "../parser";
import { run } from "../vm";
import type { Bytecode } from ".";
import { compile } from ".";

function compiled(source: string): Bytecode {
  return compile(parse(source));
}

test("empty program compiles to empty bytecode", () => {
  expect(compiled("")).toEqual([]);
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
  ]);
});

test("x = y = 2 compiles to nested DUP+STORE (right-associative)", () => {
  expect(compiled("x = y = 2")).toEqual([
    { opcode: "PUSH", value: 2 },
    { opcode: "DUP" },
    { opcode: "STORE", name: "y" },
    { opcode: "DUP" },
    { opcode: "STORE", name: "x" },
  ]);
});

test.each<{ source: string; expected: Bytecode }>([
  {
    source: "9",
    expected: [{ opcode: "PUSH", value: 9 }],
  },
  {
    source: "2.5",
    expected: [{ opcode: "PUSH", value: 2.5 }],
  },
  {
    source: "-4",
    expected: [{ opcode: "PUSH", value: 4 }, { opcode: "NEG" }],
  },
  {
    source: "-(-1)",
    expected: [
      { opcode: "PUSH", value: 1 },
      { opcode: "NEG" },
      { opcode: "NEG" },
    ],
  },
  {
    source: "+8",
    expected: [{ opcode: "PUSH", value: 8 }],
  },
  {
    source: "5-2",
    expected: [
      { opcode: "PUSH", value: 5 },
      { opcode: "PUSH", value: 2 },
      { opcode: "SUB" },
    ],
  },
  {
    source: "8/2",
    expected: [
      { opcode: "PUSH", value: 8 },
      { opcode: "PUSH", value: 2 },
      { opcode: "DIV" },
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
])("$source compiles to PUSH, PUSH, $op", ({ source, opcode }) => {
  expect(compiled(source)).toEqual([
    { opcode: "PUSH", value: 3 },
    { opcode: "PUSH", value: 2 },
    { opcode },
  ]);
});

test("1 and 1 compiles to PUSH, PUSH, AND", () => {
  expect(compiled("1 and 1")).toEqual([
    { opcode: "PUSH", value: 1 },
    { opcode: "PUSH", value: 1 },
    { opcode: "AND" },
  ]);
});

test("1 or 0 compiles to PUSH, PUSH, OR", () => {
  expect(compiled("1 or 0")).toEqual([
    { opcode: "PUSH", value: 1 },
    { opcode: "PUSH", value: 0 },
    { opcode: "OR" },
  ]);
});

test("not x compiles to LOAD, NOT", () => {
  expect(compiled("not x")).toEqual([
    { opcode: "LOAD", name: "x" },
    { opcode: "NOT" },
  ]);
});

test("a and (b or c) compiles correctly", () => {
  expect(compiled("a and (b or c)")).toEqual([
    { opcode: "LOAD", name: "a" },
    { opcode: "LOAD", name: "b" },
    { opcode: "LOAD", name: "c" },
    { opcode: "OR" },
    { opcode: "AND" },
  ]);
});

test("comparison with arithmetic operands: x + 1 > 0", () => {
  expect(compiled("x + 1 > 0")).toEqual([
    { opcode: "LOAD", name: "x" },
    { opcode: "PUSH", value: 1 },
    { opcode: "ADD" },
    { opcode: "PUSH", value: 0 },
    { opcode: "GT" },
  ]);
});

test("if: JMP_IF_ZERO around body", () => {
  expect(compiled("if 1 > 0\nx = 1\nend")).toEqual([
    { opcode: "PUSH", value: 1 },
    { opcode: "PUSH", value: 0 },
    { opcode: "GT" },
    { opcode: "JMP_IF_ZERO", target: 7 },
    { opcode: "PUSH", value: 1 },
    { opcode: "DUP" },
    { opcode: "STORE", name: "x" },
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
