import { Operator } from "./Token";

export abstract class AstNode {
  abstract evaluate(): number;
}

export class BinaryOperation extends AstNode {
  constructor(
    public left: AstNode,
    public operator: Operator,
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
      default:
        throw new Error(`Unsupported operator ${this.operator}`);
    }
  }
}

export class UnaryOperation extends AstNode {
  constructor(public operator: Operator, public child: AstNode) {
    super();
  }

  evaluate(): number {
    const value = this.child.evaluate();

    switch (this.operator) {
      case "+":
        return value;
      case "-":
        return value * -1;
      default:
        throw new Error(`Unsupported operator ${this.operator}`);
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
