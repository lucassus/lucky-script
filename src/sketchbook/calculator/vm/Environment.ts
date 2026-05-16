import { UndefinedVariable } from "./errors";
import type { Value } from "./value";

/**
 * A single scope in the lexical chain. Each function call creates a fresh
 * Environment whose `enclosing` points to the closure's captured scope.
 * if/while bodies do NOT create new Environments — they share the enclosing
 * function's Environment.
 */
export class Environment {
  public readonly records = new Map<string, Value>();

  constructor(public readonly enclosing: Environment | null = null) {}

  /** Walk the chain inward-to-outward to find a binding. */
  get(name: string): Value {
    if (this.records.has(name)) {
      return this.records.get(name)!;
    }
    if (this.enclosing !== null) {
      return this.enclosing.get(name);
    }
    throw new UndefinedVariable(name);
  }

  /** Create or overwrite a binding in the CURRENT scope only. Used by `let`. */
  define(name: string, value: Value): void {
    this.records.set(name, value);
  }

  /**
   * Walk the chain to find an existing binding and update it in place.
   * Throws UndefinedVariable if no binding exists anywhere in the chain.
   * Used by bare `x = e`.
   */
  assign(name: string, value: Value): void {
    if (this.records.has(name)) {
      this.records.set(name, value);
      return;
    }
    if (this.enclosing !== null) {
      this.enclosing.assign(name, value);
      return;
    }
    throw new UndefinedVariable(name);
  }
}
