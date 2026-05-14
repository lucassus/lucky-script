export abstract class Expr {}

export class NumberLiteral extends Expr {
  constructor(public readonly value: number) {
    super();
  }
}

export class Identifier extends Expr {
  constructor(public readonly name: string) {
    super();
  }
}

export class UnaryExpr extends Expr {
  readonly operator = "-" as const;

  constructor(public readonly operand: Expr) {
    super();
  }
}

export class BinaryExpr extends Expr {
  constructor(
    public readonly operator: "+" | "-" | "*" | "/",
    public readonly left: Expr,
    public readonly right: Expr,
  ) {
    super();
  }
}

export class CompareExpr extends Expr {
  constructor(
    public readonly operator: ">" | "<" | ">=" | "<=" | "==" | "!=",
    public readonly left: Expr,
    public readonly right: Expr,
  ) {
    super();
  }
}

export class LogicalExpr extends Expr {
  constructor(
    public readonly operator: "and" | "or",
    public readonly left: Expr,
    public readonly right: Expr,
  ) {
    super();
  }
}

export class NotExpr extends Expr {
  constructor(public readonly operand: Expr) {
    super();
  }
}

export class AssignExpr extends Expr {
  constructor(
    public readonly name: string,
    public readonly value: Expr,
  ) {
    super();
  }
}

export class ExprStmt {
  constructor(public readonly expr: Expr) {}
}

export class Program {
  constructor(public readonly body: ExprStmt[] = []) {}
}
