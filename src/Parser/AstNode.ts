export class AstNode {}

export class Program extends AstNode {
  constructor(public readonly statements: Statement[]) {
    super();
  }
}

export abstract class Statement extends AstNode {}

export abstract class Expression extends Statement {}

export class Numeral extends Expression {
  constructor(public readonly value: string) {
    super();
  }
}

export type BinaryOperator =
  | "+"
  | "-"
  | "*"
  | "/"
  | "**"
  | "<"
  | "<="
  | "=="
  | ">="
  | ">";

export class BinaryOperation extends Expression {
  constructor(
    public readonly left: Expression,
    public readonly operator: BinaryOperator,
    public readonly right: Expression
  ) {
    super();
  }
}

export type UnaryOperator = "+" | "-";

export class UnaryOperation extends Expression {
  constructor(
    public readonly operator: UnaryOperator,
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
    public readonly parameters: string[],
    public readonly statements: Statement[]
  ) {
    super();
  }
}

export class IfStatement extends Statement {
  constructor(
    public readonly condition: Expression,
    // TODO: Introduce a block?
    public readonly thenBranch: Statement[]
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
  constructor(
    public readonly name: string,
    public readonly args: Expression[]
  ) {
    super();
  }
}
