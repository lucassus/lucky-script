import { describe, expect, it } from "vitest";

import { RuntimeError } from "../errors";
import { LuckyBoolean } from "./LuckyBoolean";
import { LuckyBuiltin } from "./LuckyBuiltin";
import { LuckyNothing } from "./LuckyNothing";
import { LuckyNumber } from "./LuckyNumber";

describe("LuckyObject default operations throw RuntimeError", () => {
  const bool = LuckyBoolean.True;
  const num = new LuckyNumber(1);

  it("sub throws", () => {
    expect(() => bool.sub(num)).toThrow(RuntimeError);
  });

  it("mul throws", () => {
    expect(() => bool.mul(num)).toThrow(RuntimeError);
  });

  it("div throws", () => {
    expect(() => bool.div(num)).toThrow(RuntimeError);
  });

  it("pow throws", () => {
    expect(() => bool.pow(num)).toThrow(RuntimeError);
  });

  it("lte throws", () => {
    expect(() => bool.lte(num)).toThrow(RuntimeError);
  });

  it("gte throws", () => {
    expect(() => bool.gte(num)).toThrow(RuntimeError);
  });

  it("gt throws", () => {
    expect(() => bool.gt(num)).toThrow(RuntimeError);
  });

  it("eq throws for types without an override", () => {
    const builtin = new LuckyBuiltin("test", 0, () => LuckyNothing.Instance);
    expect(() => builtin.eq(num)).toThrow(RuntimeError);
  });
});
