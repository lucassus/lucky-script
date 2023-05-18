import { LuckyBoolean } from "./LuckyBoolean";
import { LuckyObject } from "./LuckyObject";
import { ZeroDivisionError } from "../errors";

export class LuckyNumber extends LuckyObject {
  constructor(public readonly value: number) {
    super();
  }

  add(object: LuckyObject): LuckyObject {
    this.ensureLuckyNumber(object);

    return new LuckyNumber(this.value + object.value);
  }

  sub(object: LuckyObject): LuckyObject {
    this.ensureLuckyNumber(object);

    return new LuckyNumber(this.value - object.value);
  }

  mul(object: LuckyObject): LuckyObject {
    this.ensureLuckyNumber(object);

    return new LuckyNumber(this.value * object.value);
  }

  div(object: LuckyObject): LuckyObject {
    this.ensureLuckyNumber(object);

    const otherValue = object.value;

    if (otherValue === 0) {
      throw new ZeroDivisionError();
    }

    return new LuckyNumber(this.value / otherValue);
  }

  pow(object: LuckyObject): LuckyObject {
    this.ensureLuckyNumber(object);

    return new LuckyNumber(this.value ** object.value);
  }

  lt(object: LuckyObject): LuckyBoolean {
    this.ensureLuckyNumber(object);
    return LuckyBoolean.fromNative(this.value < object.value);
  }

  lte(object: LuckyObject): LuckyBoolean {
    this.ensureLuckyNumber(object);
    return LuckyBoolean.fromNative(this.value <= object.value);
  }

  eq(object: LuckyObject): LuckyBoolean {
    this.ensureLuckyNumber(object);
    return LuckyBoolean.fromNative(this.value === object.value);
  }

  gte(object: LuckyObject): LuckyBoolean {
    this.ensureLuckyNumber(object);
    return LuckyBoolean.fromNative(this.value >= object.value);
  }

  gt(object: LuckyObject): LuckyBoolean {
    this.ensureLuckyNumber(object);
    return LuckyBoolean.fromNative(this.value > object.value);
  }

  private ensureLuckyNumber(
    object: LuckyObject
  ): asserts object is LuckyNumber {
    if (!(object instanceof LuckyNumber)) {
      this.throwIllegalOperationError();
    }
  }

  toBoolean(): LuckyBoolean {
    this.throwIllegalOperationError();
  }
}
