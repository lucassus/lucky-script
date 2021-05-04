import { RuntimeError } from "../errors";

export abstract class LuckyObject {
  add(value: LuckyObject): LuckyObject {
    this.throwIllegalOperationError();
  }

  sub(value: LuckyObject): LuckyObject {
    this.throwIllegalOperationError();
  }

  mul(value: LuckyObject): LuckyObject {
    this.throwIllegalOperationError();
  }

  div(value: LuckyObject): LuckyObject {
    this.throwIllegalOperationError();
  }

  pow(value: LuckyObject): LuckyObject {
    this.throwIllegalOperationError();
  }

  lt(right: LuckyObject): LuckyObject {
    this.throwIllegalOperationError();
  }

  protected throwIllegalOperationError(): never {
    throw new RuntimeError("Illegal operation");
  }
}
