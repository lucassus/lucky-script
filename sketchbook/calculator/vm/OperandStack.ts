import { StackOverflow, StackUnderflow } from "./errors";

/** Evaluation stack with a hard depth bound and checking pops. */
export class OperandStack {
  private readonly slots: number[] = [];

  constructor(private readonly maxDepth: number) {}

  push(value: number): void {
    if (this.slots.length >= this.maxDepth) {
      throw new StackOverflow(this.maxDepth);
    }
    this.slots.push(value);
  }

  pop(): number {
    const value = this.slots.pop();
    if (value === undefined) {
      throw new StackUnderflow();
    }
    return value;
  }

  /**
   * Final program value: removes one slot if present.
   * Does not throw on empty stack (matches bare `stack.pop()` at end of `run`).
   */
  takeResult(): number | undefined {
    return this.slots.pop();
  }
}
