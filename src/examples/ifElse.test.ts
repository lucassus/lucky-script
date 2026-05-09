import { expect, it } from "vitest";

import { run } from "../testingUtils";

it("evaluates if, elseif, and else branches correctly", () => {
  const script = `
    fun classify(n)
      if n < 0
        return -1
      elseif n == 0
        return 0
      else
        return 1
      end
    end

    classify(-5) + classify(0) * 10 + classify(5) * 100
  `;

  // -1 + 0 + 100 = 99
  expect(run(script)).toBe(99);
});

it("supports single-line if with then keyword", () => {
  const script = `
    let x = 10
    let result = 0
    if x > 0 then result = x end
    result
  `;

  expect(run(script)).toBe(10);
});
