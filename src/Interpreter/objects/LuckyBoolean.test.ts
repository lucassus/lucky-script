import { RuntimeError } from "../errors";
import { LuckyBoolean } from "./LuckyBoolean";
import { LuckyNumber } from "./LuckyNumber";

describe("LuckyBoolean.display()", () => {
  it("returns 'true' for True", () => {
    expect(LuckyBoolean.True.display()).toBe("true");
  });

  it("returns 'false' for False", () => {
    expect(LuckyBoolean.False.display()).toBe("false");
  });
});

describe("LuckyBoolean.eq()", () => {
  it("true == true", () => {
    expect(LuckyBoolean.True.eq(LuckyBoolean.True)).toBe(LuckyBoolean.True);
  });

  it("false == false", () => {
    expect(LuckyBoolean.False.eq(LuckyBoolean.False)).toBe(LuckyBoolean.True);
  });

  it("true == false is false", () => {
    expect(LuckyBoolean.True.eq(LuckyBoolean.False)).toBe(LuckyBoolean.False);
  });

  it("throws when comparing boolean to non-boolean", () => {
    expect(() => LuckyBoolean.True.eq(new LuckyNumber(1))).toThrow(
      RuntimeError,
    );
  });
});
