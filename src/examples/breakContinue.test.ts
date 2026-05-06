import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from "vitest";

import { run } from "./utils";

describe("break", () => {
  it("increments counter until 5 then breaks", () => {
    const script = `
      i = 0
      while (true) {
        if (i == 5) { break }
        i = i + 1
      }
      i
    `;
    expect(run(script)).toBe(5);
  });

  it("body executes once before break; variable visible after loop", () => {
    const script = `
      x = 0
      while (true) {
        x = 99
        break
      }
      x
    `;
    expect(run(script)).toBe(99);
  });

  it("inner break exits inner loop only; outer loop runs its full course", () => {
    const script = `
      outerCount = 0
      i = 0
      while (i < 3) {
        i = i + 1
        outerCount = outerCount + 1
        j = 0
        while (true) {
          j = j + 1
          break
        }
      }
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
      while (i < 10) {
        i = i + 1
        if (i == 3) { continue }
        print(i)
      }
    `;
    run(script);
    const calls = consoleSpy.mock.calls.map((c) => c[0]);
    expect(calls).toEqual(["1", "2", "4", "5", "6", "7", "8", "9", "10"]);
  });

  it("loop with unconditional continue terminates; no side effects", () => {
    const script = `
      i = 0
      sideEffect = 0
      while (i < 5) {
        i = i + 1
        continue
        sideEffect = sideEffect + 1
      }
      sideEffect
    `;
    expect(run(script)).toBe(0);
  });

  it("inner continue skips only the inner iteration; outer loop unaffected", () => {
    const script = `
      outerCount = 0
      i = 0
      while (i < 3) {
        i = i + 1
        outerCount = outerCount + 1
        j = 0
        while (j < 3) {
          j = j + 1
          if (j == 2) { continue }
        }
      }
      outerCount
    `;
    expect(run(script)).toBe(3);
  });
});
