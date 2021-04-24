import { AstNode, BinaryOperation, Numeral, UnaryOperation } from "../Parser";
import {
  FunctionCall,
  FunctionDeclaration,
  Program,
  ReturnStatement,
  VariableAccess,
  VariableAssigment,
} from "../Parser/AstNode";

type MyObject = number | FunctionDeclaration;

type SymbolTable = Map<string, MyObject>;

export class Interpreter {
  constructor(
    public readonly node: AstNode,
    private readonly symbolTable: SymbolTable = new Map()
  ) {}

  run() {
    return this.visit(this.node);
  }

  private visit(node: AstNode): MyObject {
    if (node instanceof Program) {
      return this.visitProgram(node);
    }

    if (node instanceof FunctionDeclaration) {
      return this.visitFunctionDeclaration(node);
    }

    if (node instanceof FunctionCall) {
      return this.visitFunctionCall(node);
    }

    if (node instanceof BinaryOperation) {
      return this.handleBinaryOperation(node);
    }

    if (node instanceof UnaryOperation) {
      return this.handleUnaryOperation(node);
    }

    if (node instanceof Numeral) {
      return this.handleNumber(node);
    }

    if (node instanceof VariableAssigment) {
      return this.handleVariableAssigment(node);
    }

    if (node instanceof VariableAccess) {
      return this.handleVariableAccess(node);
    }

    throw new Error(`Unsupported AST node type ${node.constructor.name}`);
  }

  private visitProgram(program: Program): MyObject {
    let result: MyObject = 0;

    program.statements.forEach((instruction) => {
      result = this.visit(instruction);
    });

    return result;
  }

  private visitFunctionDeclaration(node: FunctionDeclaration): number {
    this.symbolTable.set(node.name, node);
    return 0;
  }

  private visitFunctionCall(node: FunctionCall): MyObject {
    const { name } = node;

    if (!this.symbolTable.has(name)) {
      throw new Error(`Undefined function ${name}`);
    }

    const functionDeclaration = this.symbolTable.get(name);

    if (!(functionDeclaration instanceof FunctionDeclaration)) {
      throw new Error(`The given identifier '${name}' is not callable`);
    }

    for (const statement of functionDeclaration.statements) {
      if (statement instanceof ReturnStatement) {
        return this.visit(statement.expression);
      }

      this.visit(statement);
    }

    return 0;
  }

  private handleBinaryOperation(node: BinaryOperation): number {
    const leftValue = this.visit(node.left);
    const rightValue = this.visit(node.right);

    if (typeof leftValue !== "number" || typeof rightValue !== "number") {
      throw new Error("Illegal operation");
    }

    switch (node.operator) {
      case "+":
        return leftValue + rightValue;
      case "-":
        return leftValue - rightValue;
      case "*":
        return leftValue * rightValue;
      case "/":
        return leftValue / rightValue;
      case "**":
        return leftValue ** rightValue;
      default:
        throw new Error(`Unsupported operation ${node.operator}`);
    }
  }

  private handleUnaryOperation(node: UnaryOperation) {
    const value = this.visit(node.child);

    if (typeof value !== "number") {
      throw new Error("Illegal operation");
    }

    switch (node.operator) {
      case "+":
        return value;
      case "-":
        return value * -1;
      default:
        throw new Error(`Unsupported unary operation ${node.operator}`);
    }
  }

  private handleNumber(node: Numeral): number {
    const raw = node.value.replace(/_/g, "");
    return parseFloat(raw);
  }

  private handleVariableAssigment(node: VariableAssigment): MyObject {
    const value = this.visit(node.value);
    this.symbolTable.set(node.name, value);

    return value;
  }

  private handleVariableAccess(node: VariableAccess) {
    const value = this.symbolTable.get(node.name);

    if (value === undefined) {
      throw new Error(`Undefined variable ${node.name}`);
    }

    return value;
  }
}
