import { expect, test } from "vitest";

import { compile } from "./compiler";
import { parse } from "./parser";
import { run } from "./vm";

function evalExpr(source: string): number | undefined {
  const program = parse(source);
  const bytecode = compile(program);
  return run(bytecode);
}

test.each([
  ["(1 + 2) * -3", -9],

  // literals
  ["0", 0],
  ["42", 42],
  ["3.14", 3.14],
  ["0.5", 0.5],
  ["10.25", 10.25],

  // unary + / -
  ["+7", 7],
  ["-7", -7],
  ["+-2", -2],
  ["-+3", -3],
  ["-(-5)", 5],

  // binary ops
  ["1+2", 3],
  ["5-2", 3],
  ["6*7", 42],
  ["10/4", 2.5],

  // associativity (left-to-right for same precedence)
  ["10-3-2", 5],
  ["20/4/2", 2.5],
  ["2*3*4", 24],

  // precedence: mul/div before add/sub
  ["2+3*4", 14],
  ["2*3+4", 10],
  ["12-8/2", 8],
  ["10-2*3+1", 5],

  // parentheses
  ["(2+3)*4", 20],
  ["2*(3+4)", 14],
  ["((1+2))", 3],
  ["-(2+3)*4", -20],
  ["-(2+3*4)", -14],

  // spacing (grammar allows breaks between tokens)
  ["1 + 2 * 3", 7],

  // multi-statement programs: VM returns the last expression's value
  ["1\n2+3", 5],
  ["1+1\n3*4", 12],

  // assignment: returns the assigned value
  ["x = 2 + 3\nx * 4", 20],
  ["x = 5", 5],
  ["x = 1\nx = 40\nx + 3", 43],
  ["lettings = 99\nlettings", 99],

  // chained assignment: x = y = v assigns v to both, evaluates to v
  ["x = y = 1\nx", 1],
  ["x = y = 1\ny", 1],
  ["x = y = 7\nx + y", 14],
] as const)("evalExpr(%s) === %s", (source, expected) => {
  expect(evalExpr(source)).toBe(expected);
});
