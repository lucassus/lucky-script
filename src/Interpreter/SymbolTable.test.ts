import { describe, expect, it } from "vitest";

import { NameError, ScopeError } from "./errors";
import { LuckyBoolean, LuckyNumber } from "./objects";
import { SymbolTable } from "./SymbolTable";

describe("SymbolTable", () => {
  describe(".setLocal", () => {
    it("sets the given variable at the current scope", () => {
      const parent = new SymbolTable();
      parent.setLocal("x", new LuckyNumber(1));
      const child = parent.createChild();

      const value = new LuckyNumber(2);

      child.setLocal("x", value);
      expect(parent.lookup("x")).not.toBe(value);
      expect(child.lookup("x")).toBe(value);
    });

    it("throws ScopeError when called on a frozen scope", () => {
      const frozen = SymbolTable.createFrozenBuiltins({});
      expect(() => frozen.setLocal("x", new LuckyNumber(1))).toThrow(
        ScopeError,
      );
    });
  });

  describe(".setBare", () => {
    it("at top level (no function boundary) writes to the current scope", () => {
      const scope = new SymbolTable();
      scope.setBare("x", new LuckyNumber(1));
      expect(scope.lookup("x")).toEqual(new LuckyNumber(1));
    });

    it("inside a function boundary scope writes to that scope", () => {
      const topLevel = new SymbolTable();
      topLevel.setLocal("x", new LuckyNumber(1));
      const fnScope = topLevel.createChild(true);

      fnScope.setBare("x", new LuckyNumber(99));

      expect(topLevel.lookup("x")).toEqual(new LuckyNumber(1));
      expect(fnScope.lookup("x")).toEqual(new LuckyNumber(99));
    });

    it("inside a descendant of a function boundary writes to the boundary scope", () => {
      const topLevel = new SymbolTable();
      topLevel.setLocal("x", new LuckyNumber(1));
      const fnScope = topLevel.createChild(true);
      const innerScope = fnScope.createChild();

      innerScope.setBare("x", new LuckyNumber(99));

      expect(topLevel.lookup("x")).toEqual(new LuckyNumber(1));
      expect(fnScope.lookup("x")).toEqual(new LuckyNumber(99));
    });
  });

  describe(".setOuter", () => {
    it("mutates the nearest enclosing binding past the function boundary", () => {
      const topLevel = new SymbolTable();
      topLevel.setLocal("x", new LuckyNumber(1));
      const fnScope = topLevel.createChild(true);

      fnScope.setOuter("x", new LuckyNumber(99));

      expect(topLevel.lookup("x")).toEqual(new LuckyNumber(99));
    });

    it("can reach past multiple function boundaries", () => {
      const outer = new SymbolTable();
      outer.setLocal("n", new LuckyNumber(0));
      const makeScope = outer.createChild(true);
      makeScope.setLocal("n", new LuckyNumber(5));
      const incScope = makeScope.createChild(true);

      incScope.setOuter("n", new LuckyNumber(6));

      expect(makeScope.lookup("n")).toEqual(new LuckyNumber(6));
      expect(outer.lookup("n")).toEqual(new LuckyNumber(0));
    });

    it("throws ScopeError when no enclosing binding exists", () => {
      const topLevel = new SymbolTable();
      const fnScope = topLevel.createChild(true);

      expect(() => fnScope.setOuter("y", new LuckyNumber(1))).toThrow(
        ScopeError,
      );
    });

    it("throws ScopeError when called outside any function boundary", () => {
      const topLevel = new SymbolTable();
      expect(() => topLevel.setOuter("x", new LuckyNumber(1))).toThrow(
        ScopeError,
      );
    });

    it("cannot write into the frozen builtins scope", () => {
      const frozen = SymbolTable.createFrozenBuiltins({
        x: new LuckyNumber(1),
      });
      const userScope = new SymbolTable(frozen);
      const fnScope = userScope.createChild(true);

      expect(() => fnScope.setOuter("x", new LuckyNumber(99))).toThrow(
        ScopeError,
      );
    });
  });

  describe("isFunctionBoundary", () => {
    it("is false by default", () => {
      const scope = new SymbolTable();
      expect(scope.isFunctionBoundary).toBe(false);
    });

    it("is true when created via createChild(true)", () => {
      const scope = new SymbolTable();
      const child = scope.createChild(true);
      expect(child.isFunctionBoundary).toBe(true);
    });
  });

  describe("frozen builtins scope", () => {
    it("seeded with the provided values", () => {
      const frozen = SymbolTable.createFrozenBuiltins({
        x: new LuckyNumber(42),
      });
      expect(frozen.lookup("x")).toEqual(new LuckyNumber(42));
    });

    it("allows reads from child scopes", () => {
      const frozen = SymbolTable.createFrozenBuiltins({
        x: new LuckyNumber(42),
      });
      const child = frozen.createChild();
      expect(child.lookup("x")).toEqual(new LuckyNumber(42));
    });
  });

  describe(".lookup", () => {
    describe("when the variable is already defined in the current scope", () => {
      it("returns the value", () => {
        const scope = new SymbolTable();
        const value = new LuckyNumber(1);
        scope.setLocal("x", value);

        expect(scope.lookup("x")).toBe(value);
      });
    });

    describe("when the variable is already defined in the parent scope", () => {
      it("returns the value", () => {
        const parent = new SymbolTable();
        const value = new LuckyNumber(1);
        parent.setLocal("x", value);
        const child = parent.createChild();

        expect(child.lookup("x")).toBe(value);
      });
    });

    describe("when the variable is already defined somewhere in the parent scopes", () => {
      it("returns the value", () => {
        const grandParent = new SymbolTable();
        const value = new LuckyNumber(1);
        grandParent.setLocal("x", value);
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

    describe("when the variable holds a falsy-valued object", () => {
      it("returns the value without throwing", () => {
        const scope = new SymbolTable();
        scope.setLocal("x", LuckyBoolean.False);

        expect(scope.lookup("x")).toBe(LuckyBoolean.False);
      });
    });
  });
});
