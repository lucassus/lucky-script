import { NameError } from "./errors";
import { LuckyNumber } from "./objects";
import { SymbolTable } from "./SymbolTable";

describe("SymbolTable", () => {
  describe(".setLocal", () => {
    it("sets the given variable at the current scope", () => {
      const parent = new SymbolTable();
      parent.set("x", new LuckyNumber(1));
      const child = parent.createChild();

      const value = new LuckyNumber(2);

      child.setLocal("x", value);
      expect(parent.lookup("x")).not.toBe(value);
      expect(child.lookup("x")).toBe(value);
    });
  });

  describe(".set", () => {
    describe("when the given variable is not defined", () => {
      it("sets a value at the current scope", () => {
        const parent = new SymbolTable();
        const child = parent.createChild();

        const value = new LuckyNumber(1);
        child.set("x", value);

        expect(() => parent.lookup("x")).toThrow(NameError);
        expect(child.lookup("x")).toBe(value);
      });
    });

    describe("when the variable is already defined somewhere in the parent scopes", () => {
      it("overrides it in the parent scope", () => {
        const grandParent = new SymbolTable();
        grandParent.set("x", new LuckyNumber(1));
        const parent = grandParent.createChild();
        const child = parent.createChild();

        const value = new LuckyNumber(2);
        child.set("x", value);

        expect(grandParent.lookup("x")).toBe(value);
        expect(parent.lookup("x")).toBe(value);
        expect(child.lookup("x")).toBe(value);
      });
    });
  });

  describe(".lookup", () => {
    describe("when the variable is already defined in the current scope", () => {
      it("returns the value", () => {
        const scope = new SymbolTable();
        const value = new LuckyNumber(1);
        scope.set("x", value);

        expect(scope.lookup("x")).toBe(value);
      });
    });

    describe("when the variable is already defined in the parent scope", () => {
      it("returns the value", () => {
        const parent = new SymbolTable();
        const value = new LuckyNumber(1);
        parent.set("x", value);
        const child = parent.createChild();

        expect(child.lookup("x")).toBe(value);
      });
    });

    describe("when the variable is already defined somewhere in the parent scopes", () => {
      it("returns the value", () => {
        const grandParent = new SymbolTable();
        const value = new LuckyNumber(1);
        grandParent.set("x", value);
        const parent = grandParent.createChild();
        const child = parent.createChild();

        expect(child.lookup("x")).toBe(value);
      });
    });

    describe("when the variable is not defined", () => {
      it("raises NameError", () => {
        const parent = new SymbolTable();
        const child = parent.createChild();

        expect(() => child.lookup("x")).toThrow(NameError);
        expect(() => child.lookup("x")).toThrow("Identifier x is not defined");
      });
    });
  });
});
