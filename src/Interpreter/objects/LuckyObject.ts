import { RuntimeError } from "../errors";
import { LuckyBoolean } from "./LuckyBoolean";

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

  abstract toBoolean(): LuckyBoolean;

  protected throwIllegalOperationError(): never {
    throw new RuntimeError("Illegal operation");
  }
}
