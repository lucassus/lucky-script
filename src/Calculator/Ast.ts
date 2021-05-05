export abstract class AstNode {
  abstract evaluate(): number;
}

export class BinaryOperation extends AstNode {
  constructor(
    public left: AstNode,
    public operator: "+" | "-" | "*" | "/" | "**",
    public right: AstNode
  ) {
    super();
  }

  evaluate(): number {
    const left = this.left.evaluate();
    const right = this.right.evaluate();

    switch (this.operator) {
      case "+":
        return left + right;
      case "-":
        return left + right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      case "**":
        return left ** right;
    }
  }
}

export class UnaryOperation extends AstNode {
  constructor(public operator: "+" | "-", public child: AstNode) {
    super();
  }

  evaluate(): number {
    const value = this.child.evaluate();

    switch (this.operator) {
      case "+":
        return value;
      case "-":
        return value * -1;
    }
  }
}

export class NumberLiteral extends AstNode {
  constructor(public value: number) {
    super();
  }

  evaluate(): number {
    return this.value;
  }
}
