import { expect, it } from "vitest";

import { run } from "../testingUtils";

it("makeCounter closure using local and outer", () => {
  const script = `
    fn makeCounter()
      local n = 0

      fn inc()
        outer n = n + 1
      end

      fn get()
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
    fn makeCounter(initial)
      local n = initial

      fn inc()
        outer n = n + 1
      end

      fn get()
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
