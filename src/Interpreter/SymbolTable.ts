import { NameError, ScopeError } from "./errors";
import type { LuckyObject } from "./objects";

export class SymbolTable {
  private locals: Map<string, LuckyObject> = new Map();

  constructor(
    public parent?: SymbolTable,
    public readonly isFunctionBoundary: boolean = false,
    private readonly frozen: boolean = false,
  ) {}

  static createFrozenBuiltins(
    builtins: Record<string, LuckyObject>,
  ): SymbolTable {
    const scope = new SymbolTable(undefined, false, true);
    for (const [name, value] of Object.entries(builtins)) {
      scope.locals.set(name, value);
    }
    return scope;
  }

  setParent(parent: SymbolTable): void {
    this.parent = parent;
  }

  setLocal(key: string, value: LuckyObject): void {
    if (this.frozen) {
      throw new ScopeError(key);
    }
    this.locals.set(key, value);
  }

  // Bare `x = e`: inside a function → write to the function boundary scope;
  // at top level → write to the current scope.
  setBare(key: string, value: LuckyObject): void {
    const boundary = this.findNearestFunctionBoundary();
    if (boundary) {
      boundary.setLocal(key, value);
    } else {
      this.setLocal(key, value);
    }
  }

  // `outer x = e`: write to the nearest enclosing scope past the current
  // function boundary that already defines `x`. Frozen scopes are excluded.
  // Throws ScopeError when no such scope exists.
  setOuter(key: string, value: LuckyObject): void {
    const boundary = this.findNearestFunctionBoundary();
    if (!boundary?.parent) {
      throw new ScopeError(key);
    }
    const scope = boundary.parent.findWritableScopeThatDefines(key);
    if (!scope) {
      throw new ScopeError(key);
    }
    scope.setLocal(key, value);
  }

  lookup(key: string): LuckyObject {
    const scope = this.findTheClosestScopeThatDefines(key);
    return (scope ?? this).getLocal(key);
  }

  createChild(isFunctionBoundary = false): SymbolTable {
    return new SymbolTable(this, isFunctionBoundary);
  }

  private getLocal(key: string): LuckyObject {
    const value = this.locals.get(key);

    if (value === undefined) {
      throw new NameError(key);
    }

    return value;
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

  private findNearestFunctionBoundary(): SymbolTable | undefined {
    if (this.isFunctionBoundary) return this;
    return this.parent?.findNearestFunctionBoundary();
  }

  private findWritableScopeThatDefines(key: string): SymbolTable | undefined {
    if (this.frozen) return undefined;
    if (this.locals.has(key)) return this;
    return this.parent?.findWritableScopeThatDefines(key);
  }
}
