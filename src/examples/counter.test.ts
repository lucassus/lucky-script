import { expect, it } from "vitest";

import { run } from "../testingUtils";

it("makeCounter closure using local and outer", () => {
  const script = `
    function makeCounter() {
      local n = 0

      function inc() {
        outer n = n + 1
      }

      function get() {
        return n
      }

      inc()
      inc()
      return get()
    }

    makeCounter()
  `;

  expect(run(script)).toBe(2);
});

it("two independent counters do not share state", () => {
  const script = `
    function makeCounter(initial) {
      local n = initial

      function inc() {
        outer n = n + 1
      }

      function get() {
        return n
      }

      inc()
      return get()
    }

    a = makeCounter(0)
    b = makeCounter(1)
    a + b
  `;

  expect(run(script)).toBe(3);
});
