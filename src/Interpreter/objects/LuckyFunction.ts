import type { Statement } from "../../Parser/AstNode";
import type { SymbolTable } from "../SymbolTable";
import { LuckyBoolean } from "./LuckyBoolean";
import { LuckyObject } from "./LuckyObject";

export class LuckyFunction extends LuckyObject {
  constructor(
    public readonly scope: SymbolTable,
    public readonly name: string | undefined,
    public readonly parameters: string[],
    public readonly statements: Statement[],
  ) {
    super();
  }

  get arity(): number {
    return this.parameters.length;
  }

  toBoolean(): LuckyBoolean {
    return LuckyBoolean.True;
  }

  display(): string {
    return this.name ? `<function ${this.name}>` : "<function>";
  }
}
