abstract class AstNode {}

export class BinaryOperation extends AstNode {
  constructor(
    public left: AstNode,
    public operator: "+" | "-" | "*" | "/" | "**",
    public right: AstNode
  ) {
    super();
  }
}

export class UnaryOperation extends AstNode {
  constructor(public operator: "+" | "-", public child: AstNode) {
    super();
  }
}

export class NumberLiteral extends AstNode {
  constructor(public value: number) {
    super();
  }
}
