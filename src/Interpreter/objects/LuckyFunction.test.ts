import { LuckyBoolean } from "./LuckyBoolean";
import { LuckyFunction } from "./LuckyFunction";
import { SymbolTable } from "../SymbolTable";

describe("LuckyFunction.display()", () => {
  it("returns '<function name>' for a named function", () => {
    const fn = new LuckyFunction(new SymbolTable(), "foo", [], []);
    expect(fn.display()).toBe("<function foo>");
  });

  it("returns '<function>' for an anonymous function", () => {
    const fn = new LuckyFunction(new SymbolTable(), undefined, [], []);
    expect(fn.display()).toBe("<function>");
  });
});

describe("LuckyFunction.toBoolean()", () => {
  it("is always True", () => {
    const fn = new LuckyFunction(new SymbolTable(), undefined, [], []);
    expect(fn.toBoolean()).toBe(LuckyBoolean.True);
  });
});
