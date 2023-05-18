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

  static fromNative(value: boolean): LuckyBoolean {
    return value ? LuckyBoolean.True : LuckyBoolean.False;
  }
}
