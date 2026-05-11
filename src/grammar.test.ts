import { describe, expect, it } from "vitest";

import { grammar } from "./grammar";

const kitchenSinkSource = `
x = 1

1 + 2 * 3

2 ** -(3 / 2) + 1

y = -1 + 0.9999 * (3.5 + --+-4) ** 2 + x

fun add()
  x + y
end

fun foo()
  x = 1
  y = 2

  return 1 + 2 * 3 + -y ** -x
end

fun bar()
end

fun()
  return nothing
end

bar = fun ()
  return nothing
end

add()

fun curry(x)
  z = 2

  return fun (y)
    return x + y * z
  end
end

if x < 0
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
});

const validSyntaxCases = [
  "",
  "\n\n",
  "\n1\n",
  "123",
  "-123",
  "----+++123",
  "(1 + 2) * 3",
  "fun foo()\nend",
  "fun foo()\n  1 + 2 + 3\nend",
  "fun foo()\n  return 123\nend",
  "fun ()\n  return 123\nend",
  "fun ()\nend",
  "fun (x, y)\nend",
  "x = fun (x)\n  return 123\nend",
  "fun(x) 123",
  "fun(x, y) x + y",
  "foo()",
  "foo(123)",
  "foo(1, 2, 1+2+3+4)",
  "x = 123",
  "if 123\nend",
  "if x < 1\nend",
  "if x <= 1\nend",
  "if x == 1\nend",
  "if x != 1\nend",
  "if x > 1\nend",
  "if x >= 1\nend",
  "if x < 1 < 2\nend",
  "if x < 1 then print(x) end",
  "if x < 1\n  print(x)\nelseif x == 1\n  print(1)\nelse\n  print(0)\nend",
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
  "while true\n  1\nend",
  "while i < 3\n  i = i + 1\nend",
  "while false\nend",
  "while true\n  while false\n    1\n  end\nend",
  "while true\n  break\nend",
  "while i < 10\n  if i == 3\n    continue\n  end\n  i = i + 1\nend",
  "while true\n  while false\n    break\n  end\nend",
  "while true\n  if x > 0\n    break\n  else\n    continue\n  end\nend",
  "while true\n  i = i + 1\n  break\nend",
  "while true\n  break\n  continue\nend",
  "while true then break end",
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
  "fun foo(1+2)\nend",
  "x = fun bar()\nend",
  "fun bar(,y)\nend",
  "x = fun(, x, y)\nend",
  "x = fun bar(, x, y)\nend",
  "fun foo(fun(bar)\nend)\nend",
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
