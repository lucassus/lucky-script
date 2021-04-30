import { NameError } from "./errors";
import { LuckyObject } from "./objects";

export class SymbolTable {
  private locals: Map<string, LuckyObject> = new Map();

  constructor(public readonly parent?: SymbolTable) {}

  setLocal(key: string, value: LuckyObject): void {
    this.locals.set(key, value);
  }

  set(key: string, value: LuckyObject): void {
    const scope = this.findTheClosestScopeThatDefines(key) || this;
    return scope.setLocal(key, value);
  }

  lookup(key: string): LuckyObject {
    const scope = this.findTheClosestScopeThatDefines(key) || this;
    return scope.getLocal(key);
  }

  private getLocal(key: string): LuckyObject {
    const value = this.locals.get(key);

    if (value === undefined) {
      throw new NameError(key);
    }

    return value;
  }

  createChild(): SymbolTable {
    return new SymbolTable(this);
  }

  private findTheClosestScopeThatDefines(key: string): undefined | SymbolTable {
    let scope: undefined | SymbolTable = this;

    while (scope) {
      if (scope.locals.has(key)) {
        return scope;
      }

      scope = scope.parent;
    }

    return undefined;
  }
}
