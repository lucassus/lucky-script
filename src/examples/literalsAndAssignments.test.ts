import { expect, it } from "vitest";

import { run } from "../testingUtils";

it("evaluates nothing (null) value", () => {
  const script = `
    let x = nothing
    x
  `;
  // Assuming the `run` method returns `null` or a specific object representing `nothing`
  expect(run(script)).toBe(undefined);
});

it("evaluates number literals with underscores and floats", () => {
  const script = `
    let a = 1_000_000
    let b = 0.5
    a * b
  `;
  expect(run(script)).toBe(500000);
});

it("evaluates assignment chaining", () => {
  const script = `
    let x = 0
    let y = 0
    x = y = 1
    x + y
  `;
  expect(run(script)).toBe(2);
});
