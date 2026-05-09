import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from "vitest";

import { run } from "../testingUtils";

describe("while loop", () => {
  it("counts up to N with a mutating condition", () => {
    const script = `
      n = 0
      
      while n < 5
        n = n + 1
      end
      
      n
    `;

    expect(run(script)).toBe(5);
  });

  it("computes the sum of 1..N inside a function", () => {
    const script = `
      fun sumTo(n)
        total = 0
        i = 1
        
        while i <= n
          total = total + i
          i = i + 1
        end
        
        return total
      end
      
      sumTo(10)
    `;

    expect(run(script)).toBe(55);
  });

  it("early-returns from inside a while body", () => {
    const script = `
      fun firstMultipleOf(n, limit)
        i = 1
        
        while i < limit
          if i * n == 12
            return i
          end
          i = i + 1
        end
        
        return 0
      end
      
      firstMultipleOf(3, 100)
    `;

    expect(run(script)).toBe(4);
  });
});

describe("break", () => {
  it("increments counter until 5 then breaks", () => {
    const script = `
      i = 0
      
      while true
        if i == 5
          break
        end
        
        i = i + 1
      end
      
      i
    `;
    expect(run(script)).toBe(5);
  });

  it("body executes once before break; variable visible after loop", () => {
    const script = `
      x = 0
      while true
        x = 99
        break
      end
      x
    `;
    expect(run(script)).toBe(99);
  });

  it("inner break exits inner loop only; outer loop runs its full course", () => {
    const script = `
      outerCount = 0
      i = 0
      
      while i < 3
        i = i + 1
        outerCount = outerCount + 1
        j = 0
        
        while true
          j = j + 1
          break
        end
      end
      
      outerCount
    `;
    expect(run(script)).toBe(3);
  });
});

describe("continue", () => {
  let consoleSpy: MockInstance;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("prints 1-10 skipping 3", () => {
    const script = `
      i = 0
      
      while i < 10
        i = i + 1
        
        if i == 3
          continue
        end
        
        print(i)
      end
    `;
    run(script);
    const calls = consoleSpy.mock.calls.map((c) => c[0]);
    expect(calls).toEqual(["1", "2", "4", "5", "6", "7", "8", "9", "10"]);
  });

  it("loop with unconditional continue terminates; no side effects", () => {
    const script = `
      i = 0
      sideEffect = 0
      
      while i < 5
        i = i + 1
        continue
        sideEffect = sideEffect + 1
      end
      
      sideEffect
    `;
    expect(run(script)).toBe(0);
  });

  it("inner continue skips only the inner iteration; outer loop unaffected", () => {
    const script = `
      outerCount = 0
      i = 0
      
      while i < 3
        i = i + 1
        outerCount = outerCount + 1
        j = 0
        
        while j < 3
          j = j + 1
          if j == 2
            continue
          end
        end
      end
      
      outerCount
    `;
    expect(run(script)).toBe(3);
  });
});
