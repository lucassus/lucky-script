export class AstNode {}

export class Program extends AstNode {
  constructor(public readonly statements: Statement[]) {
    super();
  }
}

export abstract class Statement extends AstNode {}

export abstract class Expression extends AstNode {}

export class Numeral extends Expression {
  constructor(public readonly value: string) {
    super();
  }
}

export class BinaryOperation extends Expression {
  constructor(
    public readonly left: Expression,
    public readonly operator: string,
    public readonly right: Expression
  ) {
    super();
  }
}

export class UnaryOperation extends Expression {
  constructor(
    public readonly operator: string,
    public readonly child: Expression
  ) {
    super();
  }
}

export class VariableAssigment extends Expression {
  constructor(public readonly name: string, public readonly value: Expression) {
    super();
  }
}

export class VariableAccess extends Expression {
  constructor(public readonly name: string) {
    super();
  }
}

export class FunctionDeclaration extends Statement {
  constructor(
    public readonly name: undefined | string,
    public readonly args: string[],
    public readonly statements: Statement[]
  ) {
    super();
  }
}

export class ReturnStatement extends Statement {
  constructor(public readonly expression: Expression) {
    super();
  }
}

export class FunctionCall extends Expression {
  constructor(public readonly name: string) {
    super();
  }
}
