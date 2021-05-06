import { Operator } from "./Token";

export abstract class Expression {}

export class BinaryOperation extends Expression {
  constructor(
    public left: Expression,
    public operator: Operator,
    public right: Expression
  ) {
    super();
  }
}

export class UnaryOperation extends Expression {
  constructor(public operator: Operator, public child: Expression) {
    super();
  }
}

export class NumberLiteral extends Expression {
  constructor(public value: number) {
    super();
  }
}

export class VariableAccess extends Expression {
  constructor(public name: string) {
    super();
  }
}
