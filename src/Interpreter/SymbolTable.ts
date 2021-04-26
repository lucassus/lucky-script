import { LuckyObject } from "./objects";

export class SymbolTable {
  private map: Map<string, LuckyObject> = new Map();

  constructor(public readonly parent?: SymbolTable) {}

  // TODO: Not bad, it works almost like Python
  // TODO: Learn about python `local` keyword
  setLocal(key: string, value: LuckyObject): void {
    this.map.set(key, value);
  }

  set(key: string, value: LuckyObject): void {
    let parent = this.parent;

    // TODO: More likely it should be `parent.map.has(key)` instead of `parent.has(key)`,
    //  write a test for that!
    while (parent !== undefined && !parent.has(key)) {
      parent = parent.parent;
    }

    (parent || this).setLocal(key, value);
  }

  // TODO: Throw NameError(key)
  //  ...or maybe not?
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

  createChild(): SymbolTable {
    return new SymbolTable(this);
  }
}
