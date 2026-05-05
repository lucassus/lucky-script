import { LuckyObject } from "./LuckyObject";

export class LuckyBoolean extends LuckyObject {
  private constructor(public readonly value: boolean) {
    super();
  }

  static True = new LuckyBoolean(true);
  static False = new LuckyBoolean(false);

  toBoolean(): LuckyBoolean {
    return this;
  }

  display(): string {
    return this.value ? "true" : "false";
  }

  eq(object: LuckyObject): LuckyBoolean {
    this.ensureLuckyBoolean(object);
    return LuckyBoolean.fromNative(this.value === object.value);
  }

  private ensureLuckyBoolean(
    object: LuckyObject,
  ): asserts object is LuckyBoolean {
    if (!(object instanceof LuckyBoolean)) {
      this.throwIllegalOperationError();
    }
  }

  static fromNative(value: boolean): LuckyBoolean {
    return value ? LuckyBoolean.True : LuckyBoolean.False;
  }
}
