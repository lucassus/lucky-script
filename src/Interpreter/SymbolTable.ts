import { FunctionDeclaration } from "../Parser/AstNode";

export type MyObject = number | FunctionDeclaration;

export class SymbolTable {
  private map: Map<string, MyObject> = new Map();

  set(key: string, value: MyObject): void {
    this.map.set(key, value);
  }

  get(key: string): undefined | MyObject {
    return this.map.get(key);
  }

  has(key: string): boolean {
    return this.map.has(key);
  }
}
