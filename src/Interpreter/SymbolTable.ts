import { NameError } from "./errors";
import { LuckyObject } from "./objects";

export class SymbolTable {
  private locals: Map<string, LuckyObject> = new Map();

  constructor(public readonly parent?: SymbolTable) {}

  setLocal(key: string, value: LuckyObject): void {
    this.locals.set(key, value);
  }

  set(key: string, value: LuckyObject): void {
    let parent = this.parent;

    while (parent !== undefined && !parent.locals.has(key)) {
      parent = parent.parent;
    }

    (parent || this).setLocal(key, value);
  }

  lookup(key: string): LuckyObject {
    const value = this.locals.get(key);

    if (value !== undefined) {
      return value;
    }

    if (this.parent) {
      return this.parent.lookup(key);
    }

    throw new NameError(key);
  }

  createChild(): SymbolTable {
    return new SymbolTable(this);
  }
}
