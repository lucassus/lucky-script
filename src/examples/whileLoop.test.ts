import { expect, it } from "vitest";

import { run } from "../testingUtils";

it("counts up to N with a mutating condition", () => {
  const script = `
    n = 0
    while n < 5
      n = n + 1
    end
    n
  `;

  expect(run(script)).toBe(5);
});

it("computes the sum of 1..N inside a function", () => {
  const script = `
    fn sumTo(n)
      total = 0
      i = 1
      while i <= n
        total = total + i
        i = i + 1
      end
      return total
    end
    sumTo(10)
  `;

  expect(run(script)).toBe(55);
});

it("early-returns from inside a while body", () => {
  const script = `
    fn firstMultipleOf(n, limit)
      i = 1
      while i < limit
        if i * n == 12
          return i
        end
        i = i + 1
      end
      return 0
    end
    firstMultipleOf(3, 100)
  `;

  expect(run(script)).toBe(4);
});
