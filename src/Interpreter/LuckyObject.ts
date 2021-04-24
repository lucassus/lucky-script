import { Statement } from "../Parser/AstNode";

export class LuckyFunction {
  constructor(public readonly statements: Statement[]) {}
}

export type LuckyObject = number | LuckyFunction;
