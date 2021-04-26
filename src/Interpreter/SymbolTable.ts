import { LuckyObject } from "./LuckyObject";

export class SymbolTable {
  private map: Map<string, LuckyObject> = new Map();

  constructor(public readonly parent?: SymbolTable) {}

  set(key: string, value: LuckyObject): void {
    let parent = this.parent;

    while (parent !== undefined) {
      if (parent.has(key)) {
        break;
      }

      parent = parent.parent;
    }

    (parent || this).map.set(key, value);
  }

  get(key: string): undefined | LuckyObject {
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
