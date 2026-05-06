import type { LuckyObject } from "./objects";

export abstract class ControlFlow extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ControlFlow.prototype);
  }
}

export class Return extends ControlFlow {
  constructor(public readonly result: LuckyObject) {
    super("Return");
    Object.setPrototypeOf(this, Return.prototype);
  }
}

export class Break extends ControlFlow {
  constructor() {
    super("Break");
    Object.setPrototypeOf(this, Break.prototype);
  }
}

export class Continue extends ControlFlow {
  constructor() {
    super("Continue");
    Object.setPrototypeOf(this, Continue.prototype);
  }
}
