import { expect, expectTypeOf, test } from "vitest";

import type { Bytecode } from "./bytecode";
import { compile } from "./compiler";
import { parse } from "./parser";

function compiled(source: string): Bytecode {
  return compile(parse(source));
}

test("(1 + 2) * -3 compiles to expected bytecode", () => {
  const bytecode = compiled("(1 + 2) * -3");
  expectTypeOf(bytecode).toMatchObjectType<Bytecode>();

  const expected: Bytecode = {
    constants: [1, 2, 3],
    names: [],
    instructions: [
      { op: "push", constantIndex: 0 },
      { op: "push", constantIndex: 1 },
      { op: "add" },
      { op: "push", constantIndex: 2 },
      { op: "neg" },
      { op: "mul" },
    ],
  };

  expect<Bytecode>(bytecode).toEqual(expected);
});

test("undefined variable rejects at compile time", () => {
  expect(() => compile(parse("x + 3"))).toThrow("Undefined variable 'x'");
});

test.each<{ source: string; expected: Bytecode }>([
  {
    source: "9",
    expected: {
      constants: [9],
      names: [],
      instructions: [{ op: "push", constantIndex: 0 }],
    },
  },
  {
    source: "2.5",
    expected: {
      constants: [2.5],
      names: [],
      instructions: [{ op: "push", constantIndex: 0 }],
    },
  },
  {
    source: "-4",
    expected: {
      constants: [4],
      names: [],
      instructions: [{ op: "push", constantIndex: 0 }, { op: "neg" }],
    },
  },
  {
    source: "-(-1)",
    expected: {
      constants: [1],
      names: [],
      instructions: [
        { op: "push", constantIndex: 0 },
        { op: "neg" },
        { op: "neg" },
      ],
    },
  },
  {
    source: "+8",
    expected: {
      constants: [8],
      names: [],
      instructions: [{ op: "push", constantIndex: 0 }],
    },
  },
  {
    source: "5-2",
    expected: {
      constants: [5, 2],
      names: [],
      instructions: [
        { op: "push", constantIndex: 0 },
        { op: "push", constantIndex: 1 },
        { op: "sub" },
      ],
    },
  },
  {
    source: "8/2",
    expected: {
      constants: [8, 2],
      names: [],
      instructions: [
        { op: "push", constantIndex: 0 },
        { op: "push", constantIndex: 1 },
        { op: "div" },
      ],
    },
  },
  {
    source: "2+3*4",
    expected: {
      constants: [2, 3, 4],
      names: [],
      instructions: [
        { op: "push", constantIndex: 0 },
        { op: "push", constantIndex: 1 },
        { op: "push", constantIndex: 2 },
        { op: "mul" },
        { op: "add" },
      ],
    },
  },
  {
    source: "(2+3)*4",
    expected: {
      constants: [2, 3, 4],
      names: [],
      instructions: [
        { op: "push", constantIndex: 0 },
        { op: "push", constantIndex: 1 },
        { op: "add" },
        { op: "push", constantIndex: 2 },
        { op: "mul" },
      ],
    },
  },
  {
    source: "10-3-2",
    expected: {
      constants: [10, 3, 2],
      names: [],
      instructions: [
        { op: "push", constantIndex: 0 },
        { op: "push", constantIndex: 1 },
        { op: "sub" },
        { op: "push", constantIndex: 2 },
        { op: "sub" },
      ],
    },
  },
  {
    source: "12/3/2",
    expected: {
      constants: [12, 3, 2],
      names: [],
      instructions: [
        { op: "push", constantIndex: 0 },
        { op: "push", constantIndex: 1 },
        { op: "div" },
        { op: "push", constantIndex: 2 },
        { op: "div" },
      ],
    },
  },
  {
    source: "1+1\n3*4",
    expected: {
      constants: [1, 1, 3, 4],
      names: [],
      instructions: [
        { op: "push", constantIndex: 0 },
        { op: "push", constantIndex: 1 },
        { op: "add" },
        { op: "push", constantIndex: 2 },
        { op: "push", constantIndex: 3 },
        { op: "mul" },
      ],
    },
  },
])("compile(%j) matches bytecode snapshot", ({ source, expected }) => {
  expect(compiled(source)).toEqual(expected);
});
