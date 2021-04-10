import { AstNode } from "../Parser";
import { SymbolTable } from "./SymbolTable";

export class LuckyFunction {
  constructor(
    public readonly scope: SymbolTable,
    public readonly instructions: AstNode[]
  ) {}
}
