import { expect, expectTypeOf, test } from "vitest";

import type { Bytecode } from "./bytecode";
import { compile } from "./compiler";
import { parse } from "./parser";

function compiled(source: string): Bytecode {
  return compile(parse(source));
}

test("(1 + 2) * -3 compiles to expected bytecode", () => {
  const bytecode = compiled("(1 + 2) * -3");
  expectTypeOf(bytecode).toMatchTypeOf<Bytecode>();

  const expected: Bytecode = [
    { op: "PUSH", value: 1 },
    { op: "PUSH", value: 2 },
    { op: "ADD" },
    { op: "PUSH", value: 3 },
    { op: "NEG" },
    { op: "MUL" },
  ];

  expect<Bytecode>(bytecode).toEqual(expected);
});

test("x = 10 + 2 compiles to DUP and STORE", () => {
  expect(compiled("x = 10 + 2")).toEqual([
    { op: "PUSH", value: 10 },
    { op: "PUSH", value: 2 },
    { op: "ADD" },
    { op: "DUP" },
    { op: "STORE", name: "x" },
  ]);
});

test("x = y = 2 compiles to nested DUP+STORE (right-associative)", () => {
  expect(compiled("x = y = 2")).toEqual([
    { op: "PUSH", value: 2 },
    { op: "DUP" },
    { op: "STORE", name: "y" },
    { op: "DUP" },
    { op: "STORE", name: "x" },
  ]);
});

test.each<{ source: string; expected: Bytecode }>([
  {
    source: "9",
    expected: [{ op: "PUSH", value: 9 }],
  },
  {
    source: "2.5",
    expected: [{ op: "PUSH", value: 2.5 }],
  },
  {
    source: "-4",
    expected: [{ op: "PUSH", value: 4 }, { op: "NEG" }],
  },
  {
    source: "-(-1)",
    expected: [{ op: "PUSH", value: 1 }, { op: "NEG" }, { op: "NEG" }],
  },
  {
    source: "+8",
    expected: [{ op: "PUSH", value: 8 }],
  },
  {
    source: "5-2",
    expected: [
      { op: "PUSH", value: 5 },
      { op: "PUSH", value: 2 },
      { op: "SUB" },
    ],
  },
  {
    source: "8/2",
    expected: [
      { op: "PUSH", value: 8 },
      { op: "PUSH", value: 2 },
      { op: "DIV" },
    ],
  },
  {
    source: "2+3*4",
    expected: [
      { op: "PUSH", value: 2 },
      { op: "PUSH", value: 3 },
      { op: "PUSH", value: 4 },
      { op: "MUL" },
      { op: "ADD" },
    ],
  },
  {
    source: "(2+3)*4",
    expected: [
      { op: "PUSH", value: 2 },
      { op: "PUSH", value: 3 },
      { op: "ADD" },
      { op: "PUSH", value: 4 },
      { op: "MUL" },
    ],
  },
  {
    source: "10-3-2",
    expected: [
      { op: "PUSH", value: 10 },
      { op: "PUSH", value: 3 },
      { op: "SUB" },
      { op: "PUSH", value: 2 },
      { op: "SUB" },
    ],
  },
  {
    source: "12/3/2",
    expected: [
      { op: "PUSH", value: 12 },
      { op: "PUSH", value: 3 },
      { op: "DIV" },
      { op: "PUSH", value: 2 },
      { op: "DIV" },
    ],
  },
  {
    source: "1+1\n3*4",
    expected: [
      { op: "PUSH", value: 1 },
      { op: "PUSH", value: 1 },
      { op: "ADD" },
      { op: "POP" },
      { op: "PUSH", value: 3 },
      { op: "PUSH", value: 4 },
      { op: "MUL" },
    ],
  },
])("compile(%j) matches bytecode snapshot", ({ source, expected }) => {
  expect(compiled(source)).toEqual(expected);
});

test.each<{ source: string; op: string }>([
  { source: "3 > 2", op: "GT" },
  { source: "3 < 2", op: "LT" },
  { source: "3 >= 2", op: "GTE" },
  { source: "3 <= 2", op: "LTE" },
  { source: "3 == 2", op: "EQ" },
  { source: "3 != 2", op: "NEQ" },
])("$source compiles to PUSH, PUSH, $op", ({ source, op }) => {
  expect(compiled(source)).toEqual([
    { op: "PUSH", value: 3 },
    { op: "PUSH", value: 2 },
    { op },
  ]);
});

test("1 and 1 compiles to PUSH, PUSH, AND", () => {
  expect(compiled("1 and 1")).toEqual([
    { op: "PUSH", value: 1 },
    { op: "PUSH", value: 1 },
    { op: "AND" },
  ]);
});

test("1 or 0 compiles to PUSH, PUSH, OR", () => {
  expect(compiled("1 or 0")).toEqual([
    { op: "PUSH", value: 1 },
    { op: "PUSH", value: 0 },
    { op: "OR" },
  ]);
});

test("not x compiles to LOAD, NOT", () => {
  expect(compiled("not x")).toEqual([{ op: "LOAD", name: "x" }, { op: "NOT" }]);
});

test("a and (b or c) compiles correctly", () => {
  expect(compiled("a and (b or c)")).toEqual([
    { op: "LOAD", name: "a" },
    { op: "LOAD", name: "b" },
    { op: "LOAD", name: "c" },
    { op: "OR" },
    { op: "AND" },
  ]);
});

test("comparison with arithmetic operands: x + 1 > 0", () => {
  expect(compiled("x + 1 > 0")).toEqual([
    { op: "LOAD", name: "x" },
    { op: "PUSH", value: 1 },
    { op: "ADD" },
    { op: "PUSH", value: 0 },
    { op: "GT" },
  ]);
});
