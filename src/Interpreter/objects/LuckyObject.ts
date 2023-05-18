import { LuckyBoolean } from "./LuckyBoolean";
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

  lt(right: LuckyObject): LuckyBoolean {
    this.throwIllegalOperationError();
  }

  lte(right: LuckyObject): LuckyBoolean {
    this.throwIllegalOperationError();
  }

  eq(right: LuckyObject): LuckyBoolean {
    this.throwIllegalOperationError();
  }

  gte(right: LuckyObject): LuckyBoolean {
    this.throwIllegalOperationError();
  }

  gt(right: LuckyObject): LuckyBoolean {
    this.throwIllegalOperationError();
  }

  abstract toBoolean(): LuckyBoolean;

  protected throwIllegalOperationError(): never {
    throw new RuntimeError("Illegal operation");
  }
}
