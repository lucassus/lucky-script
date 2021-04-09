import { FunctionDeclaration } from "../Parser/AstNode";

export type MyObject = number | FunctionDeclaration;

export class SymbolTable {
  private map: Map<string, MyObject> = new Map();

  constructor(private parent?: SymbolTable) {}

  set(key: string, value: MyObject): void {
    let curr: SymbolTable = this;

    while (curr.parent !== undefined && !curr.map.has("key")) {
      curr = curr.parent;
    }

    curr.map.set(key, value);
  }

  get(key: string): undefined | MyObject {
    if (this.map.has(key)) {
      return this.map.get(key);
    }

    return this.parent ? this.parent.get(key) : undefined;
  }

  has(key: string): boolean {
    if (this.map.has(key)) {
      return true;
    }

    return this.parent ? this.parent.has(key) : false;
  }
}
