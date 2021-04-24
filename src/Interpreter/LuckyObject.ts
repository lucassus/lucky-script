import { Statement } from "../Parser/AstNode";

// TODO: Improve this idea
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

  // TODO: Is there a better way to do UnimplementedError in JavaScript?
  protected throwIllegalOperationError(): never {
    throw Error("Illegal operation");
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

  // TODO: Throw RuntimeError DivisionByZero
  div(object: LuckyObject): LuckyObject {
    this.ensureLuckyNumber(object);

    return new LuckyNumber(this.value / object.value);
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
  constructor(public readonly statements: Statement[]) {
    super();
  }
}
