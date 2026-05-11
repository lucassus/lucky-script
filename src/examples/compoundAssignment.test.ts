import { expect, it } from "vitest";

import { LuckyNumber } from "../Interpreter/objects";
import { SymbolTable } from "../Interpreter/SymbolTable";
import { run } from "../testingUtils";

it("bare compound assignment at top level", () => {
  const script = `
    let x = 10
    x += 5
    x
  `;

  expect(run(script)).toBe(15);
});

it("bare compound assignment with all operators", () => {
  const script = `
    let x = 20
    x += 5
    x -= 3
    x *= 2
    x /= 4
    x
  `;

  expect(run(script)).toBe(11);
});

it("bare compound assignment inside function mutates the nearest binding", () => {
  const script = `
    let x = 1

    fun foo()
      x += 99
      return x
    end

    foo()
    x
  `;

  expect(run(script)).toBe(100);
});

it("let compound assignment reads then writes let", () => {
  const symbolTable = new SymbolTable();
  const script = `
    let x = 10

    fun foo()
      let x += 5
      return x
    end

    foo()
  `;

  expect(run(script, symbolTable)).toBe(15);
  expect(symbolTable.lookup("x")).toEqual(new LuckyNumber(10));
});

it("compound assignment mutates enclosing variable", () => {
  const script = `
    let x = 10

    fun foo()
      x += 5
    end

    foo()
    x
  `;

  expect(run(script)).toBe(15);
});

it("compound assignment in nested function", () => {
  const script = `
    fun makeCounter()
      let n = 0

      fun inc()
        n += 1
      end

      inc()
      inc()
      return n
    end

    makeCounter()
  `;

  expect(run(script)).toBe(2);
});

it("compound assignment with expression", () => {
  const script = `
    let x = 10
    let y = 3
    x += y * 2
    x
  `;

  expect(run(script)).toBe(16);
});

it("compound assignment in while loop", () => {
  const script = `
    let i = 0
    let sum = 0

    while i < 5
      sum += i
      i += 1
    end

    sum
  `;

  expect(run(script)).toBe(10);
});

it("compound assignment with let in nested scopes", () => {
  const script = `
    let x = 100

    fun outerFn()
      let x = 10

      fun inner()
        let x += 5
        return x
      end

      return inner() + x
    end

    outerFn()
  `;

  expect(run(script)).toBe(25);
});
