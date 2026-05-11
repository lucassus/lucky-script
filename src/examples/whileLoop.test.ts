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
      let n = 0
      
      while n < 5
        let n = n + 1
      end
      
      n
    `;

    expect(run(script)).toBe(5);
  });

  it("computes the sum of 1..N inside a function", () => {
    const script = `
      fun sumTo(n)
        let total = 0
        let i = 1
        
        while i <= n
          let total = total + i
          let i = i + 1
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
        let i = 1
        
        while i < limit
          if i * n == 12
            return i
          end
          let i = i + 1
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
      let i = 0
      
      while true
        if i == 5
          break
        end
        
        let i = i + 1
      end
      
      i
    `;
    expect(run(script)).toBe(5);
  });

  it("body executes once before break; variable visible after loop", () => {
    const script = `
      let x = 0
      while true
        let x = 99
        break
      end
      x
    `;
    expect(run(script)).toBe(99);
  });

  it("inner break exits inner loop only; loop runs its full course", () => {
    const script = `
      let outerCount = 0
      let i = 0
      
      while i < 3
        let i = i + 1
        let outerCount = outerCount + 1
        let j = 0
        
        while true
          let j = j + 1
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
      let i = 0
      
      while i < 10
        let i = i + 1
        
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
      let i = 0
      let sideEffect = 0
      
      while i < 5
        let i = i + 1
        continue
        let sideEffect = sideEffect + 1
      end
      
      sideEffect
    `;
    expect(run(script)).toBe(0);
  });

  it("inner continue skips only the inner iteration; loop unaffected", () => {
    const script = `
      let outerCount = 0
      let i = 0
      
      while i < 3
        let i = i + 1
        let outerCount = outerCount + 1
        let j = 0
        
        while j < 3
          let j = j + 1
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
