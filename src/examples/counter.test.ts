import { expect, it } from "vitest";

import { run } from "../testingUtils";

it("makeCounter closure using let and reassignment", () => {
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

it("two independent counters do not share state", () => {
  const script = `
    fun makeCounter(initial)
      let n = initial

      fun inc()
        n = n + 1
      end

      fun get()
        return n
      end

      inc()
      return get()
    end

    let a = makeCounter(0)
    let b = makeCounter(1)
    a + b
  `;

  expect(run(script)).toBe(3);
});
