import { expect, it } from "vitest";

import { run } from "../testingUtils";

it("makeCounter closure using local and outer", () => {
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

it("two independent counters do not share state", () => {
  const script = `
    fun makeCounter(initial)
      local n = initial

      fun inc()
        outer n = n + 1
      end

      fun get()
        return n
      end

      inc()
      return get()
    end

    a = makeCounter(0)
    b = makeCounter(1)
    a + b
  `;

  expect(run(script)).toBe(3);
});
