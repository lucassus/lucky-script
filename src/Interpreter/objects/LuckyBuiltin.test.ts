import { describe, expect, it, vi } from "vitest";

import { LuckyBoolean } from "./LuckyBoolean";
import { LuckyBuiltin } from "./LuckyBuiltin";
import { LuckyNumber } from "./LuckyNumber";

describe("LuckyBuiltin", () => {
  it("call() invokes the native function with the provided args", () => {
    const fn = vi.fn().mockReturnValue(new LuckyNumber(99));
    const builtin = new LuckyBuiltin("test", 1, fn);
    const arg = new LuckyNumber(42);

    const result = builtin.call([arg]);

    expect(fn).toHaveBeenCalledWith([arg]);
    expect(result).toEqual(new LuckyNumber(99));
  });

  it("display() returns '<builtin name>'", () => {
    const builtin = new LuckyBuiltin("print", 1, () => new LuckyNumber(0));
    expect(builtin.display()).toBe("<builtin print>");
  });

  it("toBoolean() returns True", () => {
    const builtin = new LuckyBuiltin("print", 1, () => new LuckyNumber(0));
    expect(builtin.toBoolean()).toBe(LuckyBoolean.True);
  });
});
