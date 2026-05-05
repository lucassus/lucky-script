import { RuntimeError } from "../errors";
import { LuckyBoolean } from "./LuckyBoolean";

export abstract class LuckyObject {
  add(_value: LuckyObject): LuckyObject {
    this.throwIllegalOperationError();
  }

  sub(_value: LuckyObject): LuckyObject {
    this.throwIllegalOperationError();
  }

  mul(_value: LuckyObject): LuckyObject {
    this.throwIllegalOperationError();
  }

  div(_value: LuckyObject): LuckyObject {
    this.throwIllegalOperationError();
  }

  pow(_value: LuckyObject): LuckyObject {
    this.throwIllegalOperationError();
  }

  lt(_right: LuckyObject): LuckyBoolean {
    this.throwIllegalOperationError();
  }

  lte(_right: LuckyObject): LuckyBoolean {
    this.throwIllegalOperationError();
  }

  eq(_right: LuckyObject): LuckyBoolean {
    this.throwIllegalOperationError();
  }

  neq(right: LuckyObject): LuckyBoolean {
    return LuckyBoolean.fromNative(!this.eq(right).value);
  }

  gte(_right: LuckyObject): LuckyBoolean {
    this.throwIllegalOperationError();
  }

  gt(_right: LuckyObject): LuckyBoolean {
    this.throwIllegalOperationError();
  }

  abstract toBoolean(): LuckyBoolean;

  abstract display(): string;

  protected throwIllegalOperationError(): never {
    throw new RuntimeError("Illegal operation");
  }
}
