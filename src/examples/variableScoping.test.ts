import { expect, it } from "vitest";

import { run } from "../testingUtils";

it("if and while blocks execute in the enclosing scope without creating a new one", () => {
  const script = `
    let a = 1
    
    if true
      let a = 2
    end
    
    let i = 0
    while i < 1
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
    
    fun foo()
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

    fun foo()
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
    
    fun foo()
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
    
    fun double()
      return x * 2
    end
    
    let first = double()
    let x = 5
    let second = double()
    
    first + second
  `;

  expect(run(script)).toBe(30);
});

it("closures correctly persist and mutate state with reassignment", () => {
  const script = `
    fun makeCounter()
      let n = 0

      fun inc()
        n = n + 1
      end
    
      fun get()
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
