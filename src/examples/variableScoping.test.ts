import { expect, it } from "vitest";

import { run } from "../testingUtils";

it("if and while blocks execute in the enclosing scope without creating a new one", () => {
  const script = `
    a = 1
    if true
      a = 2
    end
    
    i = 0
    while i < 1
      a = 3
      i = i + 1
    end
    
    a
  `;

  expect(run(script)).toBe(3);
});

it("bare assignment inside a function creates a local variable", () => {
  const script = `
    a = 1
    
    fun foo()
      a = 2
    end
    
    foo()
    a
  `;

  expect(run(script)).toBe(1);
});

it("outer keyword explicitly mutates an outer variable", () => {
  const script = `
    a = 1
    
    fun foo()
      outer a = 2
    end
    
    foo()
    a
  `;

  expect(run(script)).toBe(2);
});

it("local keyword explicitly creates a local variable shadowing the outer one", () => {
  const script = `
    b = 1
    
    fun foo()
      local b = 3
      return b
    end
    
    result = foo()
    result + b
  `;

  expect(run(script)).toBe(4);
});

it("reads always walk the full scope chain and pick up updated outer values", () => {
  const script = `
    x = 10
    
    fun double()
      return x * 2
    end
    
    first = double()
    x = 5
    second = double()
    
    first + second
  `;

  expect(run(script)).toBe(30);
});

it("closures correctly persist and mutate state with the outer keyword", () => {
  const script = `
    fun makeCounter()
      local n = 0
    
      fun inc()
        outer n = n + 1
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
