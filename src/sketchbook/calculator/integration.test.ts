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

  // comparison: true yields 1, false yields 0
  ["3 > 2", 1],
  ["2 > 3", 0],
  ["3 < 2", 0],
  ["2 < 3", 1],
  ["3 >= 3", 1],
  ["2 >= 3", 0],
  ["3 <= 3", 1],
  ["4 <= 3", 0],
  ["3 == 3", 1],
  ["3 == 4", 0],
  ["3 != 4", 1],
  ["3 != 3", 0],

  // comparison with arithmetic operands
  ["x = 5\nx > 2", 1],
  ["x = 1\nx >= 1", 1],
  ["1 + 1 == 2", 1],
  ["2 * 3 > 5", 1],
  ["10 - 4 <= 6", 1],

  // comparison result stored and used
  ["a = 3 > 2\na", 1],

  // logical and
  ["1 and 1", 1],
  ["1 and 0", 0],
  ["0 and 1", 0],
  ["0 and 0", 0],

  // logical or
  ["1 or 1", 1],
  ["1 or 0", 1],
  ["0 or 1", 1],
  ["0 or 0", 0],

  // not
  ["not 0", 1],
  ["not 1", 0],
  ["not 5", 0],

  // precedence: and tighter than or
  ["0 or 1 and 1", 1],
  ["1 or 0 and 0", 1],

  // parentheses override precedence
  ["(0 or 1) and 0", 0],
  ["1 and (0 or 1)", 1],

  // logical + comparison
  ["3 > 2 and 5 > 4", 1],
  ["3 > 2 and 5 > 6", 0],
  ["3 > 2 or 5 > 6", 1],
  ["3 > 4 or 5 > 6", 0],

  // not with comparison
  ["not 3 > 2", 0],
  ["not 3 > 4", 1],

  // if / end (condition line must end before body)
  ["x = 1\nif 0\nx = 9\nend\nx", 1],
  ["x = 1\nif 1\nx = 9\nend\nx", 9],
  ["x = 0\nif x > 0\nx = 2\nend\nx", 0],
  ["x = 1\nif x > 0\nx = 3\nend\nx", 3],

  // keywords are not valid identifiers (tested via parse errors above)
  // variables whose names start with keywords are valid
  ["android = 7\nandroid", 7],
  ["order = 3\norder", 3],
] as const)("evalExpr(%s) === %s", (source, expected) => {
  expect(evalExpr(source)).toBe(expected);
});

test("kitchen sink: all features in one script", () => {
  const program = `
    x = 5
    y = 3
    z = x * y + 2
    neg = -z
    lo = hi = 0
    frac = z / 2.0
    inRange = frac >= 8 and frac <= 9
    mixed = z > neg and (x != y or lo == hi)
    result = inRange and mixed and not (z == 0)
    if x == 1
      x = 2
    end
    if x = 1 + 2 == 3
    end
    result
  `.trim();

  expect(evalExpr(program)).toBe(1);
});
