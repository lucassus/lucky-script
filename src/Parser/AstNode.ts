export abstract class AstNode {}

export class Program extends AstNode {
  constructor(public readonly statements: AstNode[]) {
    super();
  }
}

export class Numeral extends AstNode {
  constructor(public readonly value: string) {
    super();
  }
}

export class BinaryOperation extends AstNode {
  constructor(
    public readonly left: AstNode,
    public readonly operator: string,
    public readonly right: AstNode
  ) {
    super();
  }
}

export class UnaryOperation extends AstNode {
  constructor(
    public readonly operator: string,
    public readonly child: AstNode
  ) {
    super();
  }
}

export class VariableAssigment extends AstNode {
  constructor(public readonly name: string, public readonly value: AstNode) {
    super();
  }
}

export class VariableAccess extends AstNode {
  constructor(public readonly name: string) {
    super();
  }
}

export class FunctionDeclaration extends AstNode {
  constructor(
    public readonly name: undefined | string,
    public readonly statements: AstNode[]
  ) {
    super();
  }
}

export class ReturnStatement extends AstNode {
  constructor(public readonly expression: AstNode) {
    super();
  }
}

export class FunctionCall extends AstNode {
  constructor(public readonly name: string) {
    super();
  }
}
