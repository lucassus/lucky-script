import { Statement } from "../../Parser/AstNode";
import { SymbolTable } from "../SymbolTable";
import { LuckyBoolean } from "./LuckyBoolean";
import { LuckyObject } from "./LuckyObject";

export class LuckyFunction extends LuckyObject {
  constructor(
    public readonly scope: SymbolTable,
    public readonly name: string | undefined,
    public readonly parameters: string[],
    public readonly statements: Statement[]
  ) {
    super();
  }

  get arity(): number {
    return this.parameters.length;
  }

  toBoolean(): LuckyBoolean {
    this.throwIllegalOperationError();
  }
}
