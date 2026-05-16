import { expect, test } from "vitest";

import { compile } from "./compiler";
import { parse } from "./parser";
import { FrameStackOverflow, run, type RunOptions } from "./vm";

function evalExpr(source: string): number | undefined {
  const program = parse(source);
  const module = compile(program);
  return run(module);
}

function evalExprWithOptions(
  source: string,
  options: RunOptions,
): number | undefined {
  const program = parse(source);
  const module = compile(program);
  return run(module, options);
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

  // while loops
  ["x = 0\nwhile x < 5\n  x = x + 1\nend\nx", 5],
  ["x = 10\ny = 0\nwhile x > 0\n  y = y + x\n  x = x - 1\nend\ny", 55],

  // break and continue
  ["x = 0\nwhile 1\n  x = x + 1\n  if x == 5\n    break\n  end\nend\nx", 5],
  [
    "x = 0\ny = 0\nwhile x < 5\n  x = x + 1\n  if x == 3\n    continue\n  end\n  y = y + x\nend\ny",
    1 + 2 + 4 + 5,
  ],
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
    elseif x == 3
      x = 4
    else
      x = 0
    end
    
    if x = 1 + 2 == 3
    end

    while x < 10
      x = x + 1
      if x == 5
        continue
      end
      if x == 8
        break
      end
    end
    
    result
  `.trim();

  expect(evalExpr(program)).toBe(1);
});

test.each([
  [
    `
def zero()
  return 0
end
zero()
`,
    0,
  ],
  [
    `
def id(x)
  return x
end
id(42)
`,
    42,
  ],
  [
    `
def double(x)
  return x * 2
end
double(5)
`,
    10,
  ],
  [
    `
def square(x)
  return x * x
end
square(4)
`,
    16,
  ],
  [
    `
def add(a, b)
  return a + b
end
add(2, 3)
`,
    5,
  ],
  [
    `
def min(a, b)
  if a < b
    return a
  end
  return b
end
min(10, 3)
`,
    3,
  ],
  [
    `
def double(x)
  return x * 2
end
x = 3
1 + double(x) * 2
`,
    13,
  ],
  [
    `
def quad(x)
  return x * 4
end
quad(2)
`,
    8,
  ],
] as const)("simple calls: evalExpr === %s", (source, expected) => {
  expect(evalExpr(source.trim())).toBe(expected);
});

const FACT_PROG = `
def fact(n)
  if n < 2
    return 1
  end
  return n * fact(n - 1)
end
fact(K)
`.trim();

test.each([
  [0, 1],
  [1, 1],
  [2, 2],
  [5, 120],
  [10, 3628800],
] as const)("recursive factorial fact(%s) === %s", (n, expected) => {
  expect(evalExpr(FACT_PROG.replace("K", String(n)))).toBe(expected);
});

const FIB_PROG = `
def fib(n)
  if n < 2
    return n
  end
  return fib(n - 1) + fib(n - 2)
end
fib(K)
`.trim();

test.each([
  [0, 0],
  [1, 1],
  [2, 1],
  [3, 2],
  [5, 5],
  [8, 21],
  [10, 55],
  [15, 610],
] as const)("recursive fib fib(%s) === %s", (n, expected) => {
  expect(evalExpr(FIB_PROG.replace("K", String(n)))).toBe(expected);
});

const FIB_IT_PROG = `
def fibIt(n)
  a = 0
  b = 1
  i = 0
  while i < n
    t = a + b
    a = b
    b = t
    i = i + 1
  end
  return a
end
fibIt(K)
`.trim();

test.each([
  [0, 0],
  [1, 1],
  [2, 1],
  [3, 2],
  [5, 5],
  [8, 21],
  [10, 55],
  [15, 610],
] as const)("iterative fib fibIt(%s) === %s", (n, expected) => {
  expect(evalExpr(FIB_IT_PROG.replace("K", String(n)))).toBe(expected);
});

const PARITY_PROG = `
def even(n)
  if n == 0
    return 1
  end
  return odd(n - 1)
end

def odd(n)
  if n == 0
    return 0
  end
  return even(n - 1)
end
even(K)
`.trim();

test.each([
  [0, 1],
  [1, 0],
  [2, 1],
  [7, 0],
  [10, 1],
  [11, 0],
] as const)("mutual recursion even(%s) === %s", (n, expected) => {
  expect(evalExpr(PARITY_PROG.replace("K", String(n)))).toBe(expected);
});

const GCD_PROG = `
def mod(a, b)
  r = a
  while r >= b
    r = r - b
  end
  return r
end

def gcd(a, b)
  if b == 0
    return a
  end
  return gcd(b, mod(a, b))
end
gcd(A, B)
`.trim();

test.each([
  [12, 8, 4],
  [100, 75, 25],
  [17, 5, 1],
  [270, 192, 6],
] as const)("gcd(%s, %s) === %s", (a, b, expected) => {
  expect(
    evalExpr(GCD_PROG.replace("A", String(a)).replace("B", String(b))),
  ).toBe(expected);
});

test.each([
  [
    `
x = 10
def f()
  x = 5
  return x
end
y = f()
x + y
`,
    15,
  ],
  [
    `
def fa()
  x = 1
  return x
end

def fb()
  x = 99
  return x
end

fa() + fb()
`,
    100,
  ],
  [
    `
x = 99
def f(x)
  return x + 1
end
f(4)
`,
    5,
  ],
  [
    `
def f(a)
  a = a * 2
  return a
end
f(7)
`,
    14,
  ],
] as const)("isolated locals: pipeline value === %s", (source, expected) => {
  expect(evalExpr(source.trim())).toBe(expected);
});

test.each([
  [
    `
def f()
  x = 1
end
f()
`,
    0,
  ],
  [
    `
def f()
  return
end
f()
`,
    0,
  ],
  ["def abs(x)\nif x < 0\nreturn -x\nend\nreturn x\nend\nabs(-3)", 3],
  ["def abs(x)\nif x < 0\nreturn -x\nend\nreturn x\nend\nabs(0)", 0],
  ["def abs(x)\nif x < 0\nreturn -x\nend\nreturn x\nend\nabs(7)", 7],
  [
    `
def firstEven(start)
  while 1
    n = start
    while n >= 2
      n = n - 2
    end
    if n == 0
      return start
    end
    start = start + 1
  end
end
firstEven(11)
`,
    12,
  ],
  [
    `
def firstEven(start)
  while 1
    n = start
    while n >= 2
      n = n - 2
    end
    if n == 0
      return start
    end
    start = start + 1
  end
end
firstEven(14)
`,
    14,
  ],
] as const)("return semantics", (source, expected) => {
  expect(evalExpr(source.trim())).toBe(expected);
});

test.each([
  [
    `
def inc(x)
  return x + 1
end
y = inc(3)
y
`,
    4,
  ],
  [
    `
def truth()
  return 1
end
if truth()
  x = 7
else
  x = 0
end
x
`,
    7,
  ],
  [
    `
def cond()
  return 0
end
x = 0
while cond()
  x = x + 1
end
x
`,
    0,
  ],
  [
    `
def inner(x)
  return x
end
def outer(a, b)
  return a + b
end
outer(inner(2), 3)
`,
    5,
  ],
  [
    `
def inner(x)
  return x * 2
end
def outer(a, b)
  return a + b
end
outer(inner(2), 3)
`,
    7,
  ],
  [
    `
def add(a, b)
  return a + b
end
def sub(a, b)
  return a - b
end
add(1, 2) > sub(10, 5)
`,
    0,
  ],
] as const)("calls inside expressions", (source, expected) => {
  expect(evalExpr(source.trim())).toBe(expected);
});

test("kitchen sink: functions mixed with globals and control flow", () => {
  const source = `
def square(x)
  return x * x
end

def sumTo(n)
  s = 0
  i = 1
  while i <= n
    s = s + i
    i = i + 1
  end
  return s
end

def fib(n)
  if n < 2
    return n
  end
  return fib(n - 1) + fib(n - 2)
end

x = 4
a = square(x)
b = sumTo(5)
c = fib(6)

def early(n)
  if n > 10
    return 100
  end
  return n
end

d = early(3)
a + b + c + d
`.trim();

  expect(evalExpr(source)).toBe(16 + 15 + 8 + 3);
});

test.each([
  ["if 1\ndef f()\nend\nend", "def is only allowed at the top level"],
  ["while 1\ndef f()\nend\nend", "def is only allowed at the top level"],
  [
    "def outer()\ndef inner()\nend\nend",
    "def is only allowed at the top level",
  ],
  ["return 1", "return outside of a function"],
  ["if 1\nreturn 1\nend", "return outside of a function"],
  ["nosuch()", "unknown function"],
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
  ["def g(a)\nend\ng()", "arity mismatch"],
  ["def g(a)\nend\ng(1, 2)", "arity mismatch"],
  ["def dup()\nend\ndef dup()\nend", "duplicate function"],
] as const)("compile errors for %s", (source, fragment) => {
  expect(() => evalExpr(source.trim())).toThrow(fragment);
});

test("runtime FrameStackOverflow for deep recursion with tight frame cap", () => {
  const fibSource = FIB_PROG.replace("K", "50");
  expect(() => evalExprWithOptions(fibSource, { maxFrameDepth: 10 })).toThrow(
    FrameStackOverflow,
  );
});

test("regression: legacy calculator suite table remains stable", () => {
  const rows = [
    ["(1 + 2) * -3", -9],
    ["1+2", 3],
    ["x = 2 + 3\nx * 4", 20],
    ["3 > 2", 1],
    ["1 and 0", 0],
    ["x = 0\nwhile x < 5\n  x = x + 1\nend\nx", 5],
    ["x = 0\nwhile 1\n  x = x + 1\n  if x == 5\n    break\n  end\nend\nx", 5],
  ] as const;
  for (const [src, expected] of rows) {
    expect(evalExpr(src)).toBe(expected);
  }
});
