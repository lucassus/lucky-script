import { SymbolTable } from "./SymbolTable";

describe("SymbolTable", () => {
  it("acts as a map", () => {
    const symbolTable = new SymbolTable();

    symbolTable.set("x", 1);
    expect(symbolTable.has("x")).toBe(true);
    expect(symbolTable.get("x")).toBe(1);

    expect(symbolTable.has("y")).toBe(false);
  });

  describe("when the given variable is defined on the parent scope", () => {
    it("can access it", () => {
      const parent = new SymbolTable();
      parent.set("a", 1);

      const child = new SymbolTable(parent);

      expect(child.has("a")).toBe(true);
      expect(child.get("a")).toBe(1);
    });

    it("can update it", () => {
      const grandFather = new SymbolTable();
      const father = new SymbolTable();
      father.set("a", 1);
      const child = new SymbolTable(father);

      child.set("a", 2);

      expect(child.has("a")).toBe(true);
      expect(father.has("a")).toBe(true);
      expect(father.get("a")).toBe(2);
      expect(grandFather.has("a")).toBe(false);
    });
  });

  describe("when the given variable is not defined on the parent scope", () => {
    it("sets a new variable on the current scope", () => {
      const parent = new SymbolTable();
      const child = new SymbolTable(parent);

      child.set("a", 1);

      expect(child.has("a")).toBe(true);
      expect(child.get("a")).toBe(1);
      expect(parent.has("a")).toBe(false);
    });
  });
});
