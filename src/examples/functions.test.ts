import { expect, it } from "vitest";

import { run } from "../testingUtils";

it("evaluates standard function with parameters and return", () => {
  const script = `
    fun add(a, b)
      return a + b
    end
    
    add(1, 2) * 2 - 1
  `;

  expect(run(script)).toBe(5);
});

it("evaluates short-form lambdas implicitly returning their expression", () => {
  const script = `
    let double = fun(x) x * 2
    double(3)
  `;

  expect(run(script)).toBe(6);
});

it("evaluates short-form lambda with multiple arguments", () => {
  const script = `
    let add = fun(a, b) a + b
    add(5, 7)
  `;

  expect(run(script)).toBe(12);
});

it("evaluates complex lambda with full syntax", () => {
  const script = `
    let process = fun(x)
      let y = x * 2
      return y + 1
    end
    
    process(10)
  `;

  expect(run(script)).toBe(21);
});
