import { describe, expect, it } from "vitest";
import { LuckyBoolean } from "./LuckyBoolean";
import { LuckyNumber } from "./LuckyNumber";

describe("LuckyNumber.display()", () => {
  it("returns string representation of integer", () => {
    expect(new LuckyNumber(42).display()).toBe("42");
  });

  it("returns string representation of float", () => {
    expect(new LuckyNumber(3.14).display()).toBe("3.14");
  });
});

describe("LuckyNumber.toBoolean()", () => {
  it("returns False for 0", () => {
    expect(new LuckyNumber(0).toBoolean()).toBe(LuckyBoolean.False);
  });

  it("returns True for positive numbers", () => {
    expect(new LuckyNumber(1).toBoolean()).toBe(LuckyBoolean.True);
    expect(new LuckyNumber(42).toBoolean()).toBe(LuckyBoolean.True);
  });

  it("returns True for negative numbers", () => {
    expect(new LuckyNumber(-1).toBoolean()).toBe(LuckyBoolean.True);
  });
});
