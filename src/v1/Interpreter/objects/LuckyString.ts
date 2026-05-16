import { LuckyBoolean } from "./LuckyBoolean";
import { LuckyObject } from "./LuckyObject";

export class LuckyString extends LuckyObject {
  constructor(public readonly value: string) {
    super();
  }

  add(other: LuckyObject): LuckyObject {
    this.ensureLuckyString(other);
    return new LuckyString(this.value + other.value);
  }

  eq(other: LuckyObject): LuckyBoolean {
    this.ensureLuckyString(other);
    return LuckyBoolean.fromNative(this.value === other.value);
  }

  toBoolean(): LuckyBoolean {
    return LuckyBoolean.fromNative(this.value.length > 0);
  }

  display(): string {
    return this.value;
  }

  typeName(): string {
    return "string";
  }

  private ensureLuckyString(other: LuckyObject): asserts other is LuckyString {
    if (!(other instanceof LuckyString)) {
      this.throwIllegalOperationError();
    }
  }
}
