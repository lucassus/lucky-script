import { expect, it } from "vitest";

import { run } from "../testingUtils";

it("bare compound assignment at top level", () => {
  const script = `
    x = 10
    x += 5
    x
  `;

  expect(run(script)).toBe(15);
});

it("bare compound assignment with all operators", () => {
  const script = `
    x = 20
    x += 5
    x -= 3
    x *= 2
    x /= 4
    x
  `;

  expect(run(script)).toBe(11);
});

it("bare compound assignment inside function creates local binding", () => {
  const script = `
    x = 1
    
    function foo() {
      x += 99
      return x
    }
    
    foo()
    x
  `;

  expect(run(script)).toBe(1);
});

it("local compound assignment reads outer then writes local", () => {
  const script = `
    x = 10
    
    function foo() {
      local x += 5
      return x
    }
    
    foo()
  `;

  expect(run(script)).toBe(15);
});

it("outer compound assignment mutates enclosing variable", () => {
  const script = `
    x = 10
    
    function foo() {
      outer x += 5
    }
    
    foo()
    x
  `;

  expect(run(script)).toBe(15);
});

it("outer compound assignment in nested function", () => {
  const script = `
    function makeCounter() {
      local n = 0
      
      function inc() {
        outer n += 1
      }
      
      inc()
      inc()
      return n
    }
    
    makeCounter()
  `;

  expect(run(script)).toBe(2);
});

it("compound assignment with expression", () => {
  const script = `
    x = 10
    y = 3
    x += y * 2
    x
  `;

  expect(run(script)).toBe(16);
});

it("compound assignment in while loop", () => {
  const script = `
    i = 0
    sum = 0
    
    while (i < 5) {
      sum += i
      i += 1
    }
    
    sum
  `;

  expect(run(script)).toBe(10);
});

it("compound assignment with local in nested scopes", () => {
  const script = `
    x = 100
    
    function outerFn() {
      local x = 10
      
      function inner() {
        local x += 5
        return x
      }
      
      return inner() + x
    }
    
    outerFn()
  `;

  expect(run(script)).toBe(25);
});
