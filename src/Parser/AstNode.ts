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

export class NothingLiteral extends Expression {}

export class BooleanLiteral extends Expression {
  constructor(public readonly value: boolean) {
    super();
  }
}

export class StringLiteral extends Expression {
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
  | "!="
  | ">="
  | ">"
  | "and"
  | "or";

export class BinaryOperation extends Expression {
  constructor(
    public readonly left: Expression,
    public readonly operator: BinaryOperator,
    public readonly right: Expression,
  ) {
    super();
  }
}

export type UnaryOperator = "+" | "-" | "not";

export class UnaryOperation extends Expression {
  constructor(
    public readonly operator: UnaryOperator,
    public readonly child: Expression,
  ) {
    super();
  }
}

export type BindingMode = "bare" | "local" | "outer";

export class VariableAssigment extends Expression {
  constructor(
    public readonly name: string,
    public readonly value: Expression,
    public readonly mode: BindingMode = "bare",
  ) {
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
    public readonly statements: Statement[],
  ) {
    super();
  }
}

export class IfStatement extends Statement {
  constructor(
    public readonly condition: Expression,
    public readonly thenBranch: Statement[],
    public readonly elseBranch?: Statement[],
  ) {
    super();
  }
}

export class WhileStatement extends Statement {
  constructor(
    public readonly condition: Expression,
    public readonly body: Statement[],
  ) {
    super();
  }
}

export class BreakStatement extends Statement {}

export class ContinueStatement extends Statement {}

export class ReturnStatement extends Statement {
  constructor(public readonly expression: Expression) {
    super();
  }
}

export class FunctionCall extends Expression {
  constructor(
    public readonly name: string,
    public readonly args: Expression[],
  ) {
    super();
  }
}
