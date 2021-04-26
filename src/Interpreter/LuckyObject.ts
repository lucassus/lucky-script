import { Statement } from "../Parser/AstNode";
import { RuntimeError, ZeroDivisionError } from "./errors";

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

  protected throwIllegalOperationError(): never {
    throw new RuntimeError("Illegal operation");
  }
}

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

  private ensureLuckyNumber(
    object: LuckyObject
  ): asserts object is LuckyNumber {
    if (!(object instanceof LuckyNumber)) {
      this.throwIllegalOperationError();
    }
  }
}

export class LuckyFunction extends LuckyObject {
  constructor(
    public readonly parameters: string[],
    public readonly statements: Statement[]
  ) {
    super();
  }
}
