import { NameError, RuntimeError } from "./errors";
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

  // TODO: BDD vs more like unit tests

  describe(".get", () => {
    describe("when the variable is defined", () => {
      const scope = new SymbolTable();
      const number = new LuckyNumber(123);
      scope.set("x", number);

      const child = scope.createChild();

      expect(child.get("x")).toBe(number);
    });

    describe("when the variable is not defined", () => {
      it("throws NameError", () => {
        const scope = new SymbolTable();

        expect(() => scope.get("x")).toThrow(RuntimeError);
        expect(() => scope.get("x")).toThrow(NameError);
        expect(() => scope.get("x")).toThrow(new NameError("x"));
      });
    });
  });

  describe(".setLocal", () => {
    describe("on root scope", () => {
      it("sets a new variable", () => {
        const scope = new SymbolTable();

        const number = new LuckyNumber(1);
        scope.setLocal("a", number);

        expect(scope.has("a")).toBe(true);
        expect(scope.get("a")).toBe(number);
      });
    });
  });

  describe("on child scope", () => {
    it("sets a new variable locally", () => {
      const parent = new SymbolTable();
      const child = parent.createChild();

      const number = new LuckyNumber(1);
      child.setLocal("a", number);

      expect(parent.has("a")).toBe(false);
      expect(child.has("a")).toBe(true);
      expect(child.get("a")).toBe(number);
    });
  });
});
