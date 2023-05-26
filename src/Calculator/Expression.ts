import { BinaryOperator, UnaryOperator } from "./TokenType";

export abstract class Expression {}

export class BinaryOperation extends Expression {
  constructor(
    public readonly left: Expression,
    public readonly operator: BinaryOperator,
    public readonly right: Expression
  ) {
    super();
  }
}

export class UnaryOperation extends Expression {
  constructor(
    public readonly operator: UnaryOperator,
    public readonly child: Expression
  ) {
    super();
  }
}

export class VariableAccess extends Expression {
  constructor(public readonly name: string) {
    super();
  }
}

export class NumberLiteral extends Expression {
  constructor(public readonly value: number) {
    super();
  }
}
