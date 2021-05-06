import {
  BinaryOperation,
  Expression,
  NumberLiteral,
  UnaryOperation,
  VariableAccess,
} from "./Expression";

export type SymbolTable = Record<string, number>;

export class Interpreter {
  constructor(
    private readonly expression: Expression,
    private readonly symbolTable: SymbolTable = {}
  ) {}

  public evaluate(): number {
    return this.visitExpression(this.expression);
  }

  private visitExpression(expression: Expression): number {
    if (expression instanceof BinaryOperation) {
      return this.visitBinaryOperation(expression);
    }

    if (expression instanceof UnaryOperation) {
      return this.visitUnaryOperation(expression);
    }

    if (expression instanceof VariableAccess) {
      return this.visitVariableAccess(expression);
    }

    if (expression instanceof NumberLiteral) {
      return this.visitNumberLiteral(expression);
    }

    return 0;
  }

  private visitBinaryOperation(expression: BinaryOperation): number {
    const left = this.visitExpression(expression.left);
    const right = this.visitExpression(expression.right);

    switch (expression.operator) {
      case "+":
        return left + right;
      case "-":
        return left + right;
      case "*":
        return left * right;
      case "/": {
        if (right === 0) {
          throw new Error("Division by zero");
        }

        return left / right;
      }
      case "**":
        return left ** right;
      default:
        throw new Error(`Unsupported binary operator ${expression.operator}`);
    }
  }

  private visitUnaryOperation(expression: UnaryOperation) {
    const value = this.visitExpression(expression.child);

    switch (expression.operator) {
      case "+":
        return value;
      case "-":
        return value * -1;
      default:
        throw new Error(`Unsupported unary operator ${expression.operator}`);
    }
  }

  private visitVariableAccess(expression: VariableAccess): number {
    const name = expression.name;
    const value = this.symbolTable[name];

    if (value === undefined) {
      throw new Error(`Undefined variable ${name}`);
    }

    return value;
  }

  private visitNumberLiteral(expression: NumberLiteral) {
    return expression.value;
  }
}
