import { expect, it } from "vitest";
import { run } from "./utils";

it("counts up to N with a mutating condition", () => {
  const script = `
    n = 0
    while (n < 5) {
      n = n + 1
    }
    n
  `;

  expect(run(script)).toBe(5);
});

it("computes the sum of 1..N inside a function", () => {
  const script = `
    function sumTo(n) {
      total = 0
      i = 1
      while (i <= n) {
        total = total + i
        i = i + 1
      }
      return total
    }
    sumTo(10)
  `;

  expect(run(script)).toBe(55);
});

it("early-returns from inside a while body", () => {
  const script = `
    function firstMultipleOf(n, limit) {
      i = 1
      while (i < limit) {
        if (i * n == 12) { return i }
        i = i + 1
      }
      return 0
    }
    firstMultipleOf(3, 100)
  `;

  expect(run(script)).toBe(4);
});
