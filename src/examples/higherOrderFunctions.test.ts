import { expect, it } from "vitest";

import { run } from "../testingUtils";

it("supports higher order functions returning another function", () => {
  const script = `
    foo = fun()
      x = 1
    
      return fun()
        return x + 2
      end
    end
    
    bar = foo()
    bar()
  `;

  expect(run(script)).toBe(3);
});

it("supports higher order functions with short-form lambdas", () => {
  const script = `
    fun makeMultiplier(factor)
      return fun(x) x * factor
    end

    double = makeMultiplier(2)
    triple = makeMultiplier(3)

    double(5) + triple(4)
  `;

  expect(run(script)).toBe(22);
});

it("supports passing functions as arguments", () => {
  const script = `
    fun applyTwice(f, value)
      return f(f(value))
    end

    applyTwice(fun(x) x * 2, 5)
  `;

  expect(run(script)).toBe(20);
});
