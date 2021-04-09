import { FunctionDeclaration } from "../Parser/AstNode";

export type MyObject = number | FunctionDeclaration;

export class SymbolTable {
  private map: Map<string, MyObject> = new Map();

  constructor(public readonly parent?: SymbolTable) {}

  set(key: string, value: MyObject): void {
    let parent = this.parent;

    while (parent !== undefined) {
      if (parent.has(key)) {
        break;
      }

      parent = parent.parent;
    }

    (parent || this).map.set(key, value);
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
