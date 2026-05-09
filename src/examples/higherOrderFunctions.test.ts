import { expect, it } from "vitest";

import { run } from "../testingUtils";

it("supports higher order functions returning another function", () => {
  const script = `
    let foo = fun()
      let x = 1
    
      return fun()
        return x + 2
      end
    end
    
    let bar = foo()
    bar()
  `;

  expect(run(script)).toBe(3);
});

it("supports higher order functions with short-form lambdas", () => {
  const script = `
    fun makeMultiplier(factor)
      return fun(x) x * factor
    end

    let double = makeMultiplier(2)
    let triple = makeMultiplier(3)

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

it("supports passing named functions as arguments", () => {
  const script = `
    fun add(x, y)
      return x + y
    end

    let sub = fun (x, y)
      return x - y
    end

    fun perform(operation, x, y)
      return operation(x, y)
    end

    perform(add, 10, 3) + perform(sub, 10, 3)
  `;

  expect(run(script)).toBe(20);
});
