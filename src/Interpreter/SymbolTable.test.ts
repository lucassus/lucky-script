import { LuckyNumber } from "./objects";
import { SymbolTable } from "./SymbolTable";

describe("SymbolTable", () => {
  it("acts as a map", () => {
    const symbolTable = new SymbolTable();

    symbolTable.set("x", new LuckyNumber(1));
    expect(symbolTable.has("x")).toBe(true);
    // TODO: Fix this expectation and other, and `toBe` matcher
    expect(symbolTable.get("x")).toEqual(new LuckyNumber(1));

    expect(symbolTable.has("y")).toBe(false);
  });

  describe("when the given variable is defined on the parent scope", () => {
    it("can access it", () => {
      const number = new LuckyNumber(1);

      const parent = new SymbolTable();
      parent.set("a", number);

      const child = parent.createChild();

      expect(child.has("a")).toBe(true);
      expect(child.get("a")).toBe(number);
    });

    it("can update it", () => {
      const grandFather = new SymbolTable();
      const parent = new SymbolTable();
      parent.set("a", new LuckyNumber(1));
      const child = parent.createChild();

      child.set("a", new LuckyNumber(2));

      expect(child.has("a")).toBe(true);
      expect(parent.has("a")).toBe(true);
      expect(parent.get("a")).toEqual(new LuckyNumber(2));
      expect(grandFather.has("a")).toBe(false);
    });
  });

  describe("when the given variable is not defined on the parent scope", () => {
    it("sets a new variable on the current scope", () => {
      const parent = new SymbolTable();
      const child = parent.createChild();

      child.set("a", new LuckyNumber(1));

      expect(child.has("a")).toBe(true);
      expect(child.get("a")).toEqual(new LuckyNumber(1));
      expect(parent.has("a")).toBe(false);
    });
  });
});
