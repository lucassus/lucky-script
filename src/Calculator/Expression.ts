import { BinaryOperator, UnaryOperator } from "./TokenType";

export abstract class Expression {}

export class BinaryOperation extends Expression {
  constructor(
    public left: Expression,
    public operator: BinaryOperator,
    public right: Expression
  ) {
    super();
  }
}

export class UnaryOperation extends Expression {
  constructor(public operator: UnaryOperator, public child: Expression) {
    super();
  }
}

export class VariableAccess extends Expression {
  constructor(public name: string) {
    super();
  }
}

export class NumberLiteral extends Expression {
  constructor(public value: number) {
    super();
  }
}
