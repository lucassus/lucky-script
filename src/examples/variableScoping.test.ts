import { expect, it } from "vitest";

import { NameError } from "../Interpreter/errors";
import { run } from "../testingUtils";

it("if and while blocks execute in the enclosing scope without creating a new one", () => {
  const script = `
    let a = 1
    
    if true then
      let a = 2
    end
    
    let i = 0
    while i < 1 do
      let a = 3
      let i = i + 1
    end
    
    a
  `;

  expect(run(script)).toBe(3);
});

it("bare assignment inside a function creates a let variable", () => {
  const script = `
    let a = 1
    
    fun foo() do
      let a = 2
    end
    
    foo()
    a
  `;

  expect(run(script)).toBe(1);
});

it("assignment mutates an existing outer variable", () => {
  const script = `
    let a = 1

    fun foo() do
      a = 2
    end
    
    foo()
    a
  `;

  expect(run(script)).toBe(2);
});

it("let keyword explicitly creates a let variable shadowing the one", () => {
  const script = `
    let b = 1
    
    fun foo() do
      let b = 3
      return b
    end
    
    let result = foo()
    result + b
  `;

  expect(run(script)).toBe(4);
});

it("reads always walk the full scope chain and pick up updated values", () => {
  const script = `
    let x = 10
    
    fun double() do
      return x * 2
    end
    
    let first = double()
    let x = 5
    let second = double()
    
    first + second
  `;

  expect(run(script)).toBe(30);
});

it("assignment to undeclared top-level name raises NameError", () => {
  expect(() => run("x = 1")).toThrow(new NameError("x"));
});

it("top-level reassignment of builtin without declaration raises NameError", () => {
  expect(() => run('print = "x"')).toThrow(new NameError("print"));
});

it("closures correctly persist and mutate state with reassignment", () => {
  const script = `
    fun makeCounter() do
      let n = 0

      fun inc() do
        n = n + 1
      end
    
      fun get() do
        return n
      end
    
      inc()
      inc()
      return get()
    end
    
    makeCounter()
  `;

  expect(run(script)).toBe(2);
});
