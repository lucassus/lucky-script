import { describe, expect, it } from "vitest";

import { grammar } from "./grammar";

const kitchenSinkSource = `
x = 1

1 + 2 * 3

2 ** -(3 / 2) + 1

y = -1 + 0.9999 * (3.5 + --+-4) ** 2 + x

fun add() do
  x + y
end

fun foo() do
  x = 1
  y = 2

  return 1 + 2 * 3 + -y ** -x
end

fun bar() do
end

fun() do
  return nothing
end

bar = fun () do
  return nothing
end

add()

fun curry(x) do
  z = 2

  return fun (y) do
    return x + y * z
  end
end

if x < 0 then
  x = 0
end

curry(123)

greeting = "hello"
message = greeting + " world"
`
  .trim()
  .replace(/^[ \t]+/gm, "");

describe("LuckyScript Ohm grammar", () => {
  it("rejects two statements on one line (space override)", () => {
    expect(grammar.match("1 2").failed()).toBe(true);
  });

  it.each(validSyntaxCases)("accepts valid syntax: %#", (src) => {
    expect(grammar.match(src, "Program").succeeded()).toBe(true);
  });

  it.each(invalidSyntaxCases)("rejects invalid syntax: %#", (src) => {
    expect(grammar.match(src, "Program").failed()).toBe(true);
  });

  it.each(luckySpecificNegatives)(
    "rejects (Lucky-specific negative): %#",
    (src) => {
      expect(grammar.match(src, "Program").failed()).toBe(true);
    },
  );

  describe("numeric literal micro-spec", () => {
    it.each(["0", "0.5", ".5", "1_000", "1.000_001"])(
      "accepts %s as a whole program",
      (src) => {
        expect(grammar.match(src, "Program").succeeded()).toBe(true);
      },
    );

    it.each(["0123", "1_", "1__0", "5.", "1e10"])(
      "rejects %s as a whole program",
      (src) => {
        expect(grammar.match(src, "Program").failed()).toBe(true);
      },
    );

    it("rejects +1 as a bare number lexeme (sign is unary at factor)", () => {
      expect(grammar.match("+1", "numberLex").failed()).toBe(true);
    });

    it("accepts +1 as a program via unary + on factor", () => {
      expect(grammar.match("+1", "Program").succeeded()).toBe(true);
    });
  });

  it("accepts the kitchen-sink integration script", () => {
    expect(grammar.match(kitchenSinkSource, "Program").succeeded()).toBe(true);
  });

  describe("then/do block openers (reference grammar)", () => {
    it.each`
      snippet
      ${"if true then break end"}
      ${"while true do break end"}
      ${"if x < 1 then\n  print(x)\nelseif x == 1 then\n  print(1)\nelse\n  print(0)\nend"}
      ${"fun () do end"}
      ${"fun foo() do\n  1\nend"}
    `("accepts: $snippet", ({ snippet }) => {
      expect(grammar.match(snippet, "Program").succeeded()).toBe(true);
    });

    it.each`
      snippet
      ${"if true\n  1\nend"}
      ${"while true\n  1\nend"}
      ${"while true then 1 end"}
      ${"fun () end"}
      ${"if x then\n  1\nelseif y\n  2\nend"}
      ${"fun (x)\n  return x\nend"}
      ${"if x then\nelse if y then\nend\nend"}
    `("rejects: $snippet", ({ snippet }) => {
      expect(grammar.match(snippet, "Program").failed()).toBe(true);
    });
  });
});

const validSyntaxCases = [
  "",
  "\n\n",
  "\n1\n",
  "123",
  "-123",
  "----+++123",
  "(1 + 2) * 3",
  "fun foo() do\nend",
  "fun foo() do\n  1 + 2 + 3\nend",
  "fun foo() do\n  return 123\nend",
  "fun () do\n  return 123\nend",
  "fun () do\nend",
  "fun (x, y) do\nend",
  "x = fun (x) do\n  return 123\nend",
  "fun(x) 123",
  "fun(x, y) x + y",
  "foo()",
  "foo(123)",
  "foo(1, 2, 1+2+3+4)",
  "x = 123",
  "if 123 then\nend",
  "if x < 1 then\nend",
  "if x <= 1 then\nend",
  "if x == 1 then\nend",
  "if x != 1 then\nend",
  "if x > 1 then\nend",
  "if x >= 1 then\nend",
  "if x < 1 < 2 then\nend",
  "if x < 1 then print(x) end",
  "if x < 1 then\n  print(x)\nelseif x == 1 then\n  print(1)\nelse\n  print(0)\nend",
  "return 1234",
  '"hello"',
  '""',
  '"hello" + " world"',
  '"a" == "b"',
  '"a" != "b"',
  '"say \\"hi\\""',
  '"line1\\nline2"',
  '"back\\\\slash"',
  "true",
  "false",
  "not true",
  "not false",
  "not 0",
  "not 1",
  "not -1",
  "true and true",
  "true and false",
  "false and true",
  "1 and 2",
  "0 and true",
  "false and undeclaredFn()",
  "false or true",
  "false or false",
  "0 or false",
  "-1 or 0",
  "true or undeclaredFn()",
  "true and false == false",
  "let x = 1",
  "let x = 1 + 2",
  "while true do\n  1\nend",
  "while i < 3 do\n  i = i + 1\nend",
  "while false do\nend",
  "while true do\n  while false do\n    1\n  end\nend",
  "while true do\n  break\nend",
  "while i < 10 do\n  if i == 3 then\n    continue\n  end\n  i = i + 1\nend",
  "while true do\n  while false do\n    break\n  end\nend",
  "while true do\n  if x > 0 then\n    break\n  else\n    continue\n  end\nend",
  "while true do\n  i = i + 1\n  break\nend",
  "while true do\n  break\n  continue\nend",
  "while true do break end",
  "x += 1",
  "x -= 1",
  "x *= 1",
  "x /= 1",
  "let x += 1",
  "let x -= 1",
  "let x *= 1",
  "let x /= 1",
  "x += 1 + 2",
  "counter -= 1",
  "total *= 2",
  "value /= 10",
] as const;

const invalidSyntaxCases = [
  "1 2 3",
  "fun foo(1+2) do\nend",
  "x = fun bar() do\nend",
  "fun bar(,y) do\nend",
  "x = fun(, x, y) do\nend",
  "x = fun bar(, x, y) do\nend",
  "fun foo(fun(bar) do\nend) do\nend",
  "while true 1 end",
] as const;

const luckySpecificNegatives = [
  "1; 2",
  "1\r\n2",
  "1\t+\t2",
  "_foo",
  "my_var = 1",
  "local x = 1",
  "outer x = 1",
  "if = 1",
  "in = 1",
  "if x\nelse if y\nend\nend",
  "fun (x) 123 end",
  "1 + fun(x) x",
] as const;
