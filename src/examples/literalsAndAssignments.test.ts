import { expect, it } from "vitest";

import { run } from "../testingUtils";

it("evaluates nothing (null) value", () => {
  const script = `
    x = nothing
    x
  `;
  // Assuming the `run` method returns `null` or a specific object representing `nothing`
  expect(run(script)).toBe(undefined);
});

it("evaluates number literals with underscores and floats", () => {
  const script = `
    a = 1_000_000
    b = 0.5
    a * b
  `;
  expect(run(script)).toBe(500000);
});

it("evaluates assignment chaining", () => {
  const script = `
    x = y = 1
    x + y
  `;
  expect(run(script)).toBe(2);
});
