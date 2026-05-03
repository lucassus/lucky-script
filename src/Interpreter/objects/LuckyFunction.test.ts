import { LuckyBoolean } from "./LuckyBoolean";
import { LuckyFunction } from "./LuckyFunction";
import { SymbolTable } from "../SymbolTable";

describe("LuckyFunction.toBoolean()", () => {
  it("is always True", () => {
    const fn = new LuckyFunction(new SymbolTable(), undefined, [], []);
    expect(fn.toBoolean()).toBe(LuckyBoolean.True);
  });
});
