import { NameError } from "./errors";
import { LuckyObject } from "./objects";

export class SymbolTable {
  private locals: Map<string, LuckyObject> = new Map();

  constructor(public readonly parent?: SymbolTable) {}

  setLocal(key: string, value: LuckyObject): void {
    this.locals.set(key, value);
  }

  set(key: string, value: LuckyObject): void {
    const scope = this.findTheClosestScopeThatDefines(key);
    (scope || this).setLocal(key, value);
  }

  lookup(key: string): LuckyObject {
    const scope = this.findTheClosestScopeThatDefines(key);
    return (scope || this).getLocal(key);
  }

  createChild(): SymbolTable {
    return new SymbolTable(this);
  }

  private getLocal(key: string): LuckyObject {
    const value = this.locals.get(key);

    if (value) {
      return value;
    }

    throw new NameError(key);
  }

  private findTheClosestScopeThatDefines(key: string): undefined | SymbolTable {
    if (this.locals.has(key)) {
      return this;
    }

    if (this.parent) {
      return this.parent.findTheClosestScopeThatDefines(key);
    }

    return undefined;
  }
}
