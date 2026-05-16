import { describe, expect, it } from "vitest";

import { NameError, ScopeError } from "./errors";
import { LuckyBoolean, LuckyNumber } from "./objects";
import { SymbolTable } from "./SymbolTable";

describe("SymbolTable", () => {
  describe(".declare", () => {
    it("sets the given variable at the current scope", () => {
      const parent = new SymbolTable();
      parent.declare("x", new LuckyNumber(1));
      const child = parent.createChild();

      const value = new LuckyNumber(2);

      child.declare("x", value);
      expect(parent.lookup("x")).not.toBe(value);
      expect(child.lookup("x")).toBe(value);
    });

    it("throws ScopeError when called on a frozen scope", () => {
      const frozen = SymbolTable.createFrozenBuiltins({});
      expect(() => frozen.declare("x", new LuckyNumber(1))).toThrow(ScopeError);
    });

    it("rebinds silently in the same scope", () => {
      const scope = new SymbolTable();
      scope.declare("x", new LuckyNumber(1));
      scope.declare("x", new LuckyNumber(2));
      expect(scope.lookup("x")).toEqual(new LuckyNumber(2));
    });
  });

  describe(".reassign", () => {
    it("mutates the nearest existing binding", () => {
      const topLevel = new SymbolTable();
      topLevel.declare("x", new LuckyNumber(1));
      const fnScope = topLevel.createChild(true);
      fnScope.declare("x", new LuckyNumber(5));

      fnScope.reassign("x", new LuckyNumber(9));

      expect(fnScope.lookup("x")).toEqual(new LuckyNumber(9));
      expect(topLevel.lookup("x")).toEqual(new LuckyNumber(1));
    });

    it("walks outward and mutates an enclosing binding", () => {
      const outer = new SymbolTable();
      outer.declare("n", new LuckyNumber(0));
      const makeScope = outer.createChild(true);
      const incScope = makeScope.createChild(true);

      incScope.reassign("n", new LuckyNumber(6));

      expect(outer.lookup("n")).toEqual(new LuckyNumber(6));
    });

    it("throws NameError when no binding exists", () => {
      const topLevel = new SymbolTable();
      const fnScope = topLevel.createChild(true);

      expect(() => fnScope.reassign("y", new LuckyNumber(1))).toThrow(
        NameError,
      );
    });

    it("cannot mutate the frozen builtins scope", () => {
      const frozen = SymbolTable.createFrozenBuiltins({
        x: new LuckyNumber(1),
      });
      const userScope = new SymbolTable(frozen);
      const fnScope = userScope.createChild(true);

      expect(() => fnScope.reassign("x", new LuckyNumber(99))).toThrow(
        NameError,
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
    it("returns a local value", () => {
      const scope = new SymbolTable();
      const value = new LuckyNumber(1);
      scope.declare("x", value);

      expect(scope.lookup("x")).toBe(value);
    });

    it("returns a parent value", () => {
      const parent = new SymbolTable();
      const value = new LuckyNumber(1);
      parent.declare("x", value);
      const child = parent.createChild();

      expect(child.lookup("x")).toBe(value);
    });

    it("raises NameError when undefined", () => {
      const parent = new SymbolTable();
      const child = parent.createChild();

      expect(() => child.lookup("x")).toThrow(NameError);
      expect(() => child.lookup("x")).toThrow("Identifier x is not defined");
    });

    it("returns falsy values without throwing", () => {
      const scope = new SymbolTable();
      scope.declare("x", LuckyBoolean.False);

      expect(scope.lookup("x")).toBe(LuckyBoolean.False);
    });
  });
});
