import { StackOverflow, StackUnderflow } from "./errors";

/** Evaluation stack with a hard depth bound and checked pops. */
export class OperandStack<T> {
  private readonly slots: T[] = [];

  constructor(private readonly maxDepth: number) {}

  push(value: T): void {
    if (this.slots.length >= this.maxDepth) {
      throw new StackOverflow(this.maxDepth);
    }
    this.slots.push(value);
  }

  pop(): T {
    const value = this.slots.pop();
    if (value === undefined) {
      throw new StackUnderflow();
    }
    return value;
  }

  get isEmpty(): boolean {
    return this.slots.length === 0;
  }
}
