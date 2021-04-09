import { SymbolTable } from "./SymbolTable";

describe("SymbolTable", () => {
  it("acts as a map", () => {
    const symbolTable = new SymbolTable();

    symbolTable.set("x", 1);
    expect(symbolTable.has("x")).toBe(true);
    expect(symbolTable.get("x")).toBe(1);

    expect(symbolTable.has("y")).toBe(false);
  });

  it("can access variables from the parent scope", () => {
    const root = new SymbolTable();
    root.set("a", 1);

    const child = new SymbolTable(root);

    expect(child.has("a")).toBe(true);
    expect(child.get("a")).toBe(1);
  });

  it("can set variables on the parent scope", () => {
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
