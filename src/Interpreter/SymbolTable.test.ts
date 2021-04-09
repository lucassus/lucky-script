import { SymbolTable } from "./SymbolTable";

describe("SymbolTable", () => {
  it("acts as a map", () => {
    const symbolTable = new SymbolTable();

    symbolTable.set("x", 1);
    expect(symbolTable.has("x")).toBe(true);
    expect(symbolTable.get("x")).toBe(1);

    expect(symbolTable.has("y")).toBe(false);
  });
});
