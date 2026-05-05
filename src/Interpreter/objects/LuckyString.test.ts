import { describe, expect, it } from "vitest";

import { LuckyBoolean } from "./LuckyBoolean";
import { LuckyNumber } from "./LuckyNumber";
import { LuckyString } from "./LuckyString";

describe("LuckyString.add()", () => {
  it("concatenates two strings", () => {
    const result = new LuckyString("hello").add(new LuckyString(" world"));
    expect(result).toBeInstanceOf(LuckyString);
    expect((result as LuckyString).value).toBe("hello world");
  });

  it("throws RuntimeError when adding a non-string", () => {
    expect(() => new LuckyString("x").add(new LuckyNumber(1))).toThrow();
  });
});

describe("LuckyString.eq()", () => {
  it("returns True for equal strings", () => {
    expect(new LuckyString("a").eq(new LuckyString("a"))).toBe(
      LuckyBoolean.True,
    );
  });

  it("returns False for unequal strings", () => {
    expect(new LuckyString("a").eq(new LuckyString("b"))).toBe(
      LuckyBoolean.False,
    );
  });

  it("throws RuntimeError when comparing to a non-string", () => {
    expect(() => new LuckyString("a").eq(new LuckyNumber(1))).toThrow();
  });
});

describe("LuckyString.neq()", () => {
  it("returns True for unequal strings (inherited from LuckyObject)", () => {
    expect(new LuckyString("a").neq(new LuckyString("b"))).toBe(
      LuckyBoolean.True,
    );
  });

  it("returns False for equal strings", () => {
    expect(new LuckyString("a").neq(new LuckyString("a"))).toBe(
      LuckyBoolean.False,
    );
  });
});

describe("LuckyString.toBoolean()", () => {
  it("returns False for empty string", () => {
    expect(new LuckyString("").toBoolean()).toBe(LuckyBoolean.False);
  });

  it("returns True for non-empty string", () => {
    expect(new LuckyString("x").toBoolean()).toBe(LuckyBoolean.True);
    expect(new LuckyString(" ").toBoolean()).toBe(LuckyBoolean.True);
  });
});

describe("LuckyString.display()", () => {
  it("returns the raw string value without surrounding quotes", () => {
    expect(new LuckyString("hello").display()).toBe("hello");
  });

  it("returns an empty string for an empty LuckyString", () => {
    expect(new LuckyString("").display()).toBe("");
  });
});
