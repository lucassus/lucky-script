import { StackOverflow, StackUnderflow } from "./errors";

/** Evaluation stack with a hard depth bound and checked pops. */
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

  get isEmpty(): boolean {
    return this.slots.length === 0;
  }
}
