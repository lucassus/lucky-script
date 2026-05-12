import { expect, it } from "vitest";

import { run } from "../testingUtils";

it("evaluates arithmetic operators correctly", () => {
  const script = `
    1 + 2 * 3 ** 2
  `;
  expect(run(script)).toBe(19);
});

it("evaluates unary operators correctly", () => {
  const script = `
    -5 + 3
  `;
  expect(run(script)).toBe(-2);
});

it("evaluates comparison operators correctly", () => {
  const script = `
    let result = 0
    if 1 < 2 and 1 == 1 and 1 != 2 then
      let result = 42
    end
    result
  `;
  expect(run(script)).toBe(42);
});
