import { AstNode, BinaryOperation, Numeral, UnaryOperation } from "../Parser";
import {
  FunctionCall,
  FunctionDeclaration,
  Program,
  ReturnStatement,
  VariableAccess,
  VariableAssigment,
} from "../Parser/AstNode";
import { NameError, RuntimeError } from "./errors";
import { LuckyFunction, LuckyNumber, LuckyObject } from "./LuckyObject";
import { SymbolTable } from "./SymbolTable";

export class Interpreter {
  constructor(
    public readonly node: AstNode,
    private symbolTable = new SymbolTable()
  ) {}

  run(): undefined | number {
    const luckyObject = this.visit(this.node);

    if (luckyObject instanceof LuckyNumber) {
      return luckyObject.value;
    }
  }

  private visit(node: AstNode): LuckyObject {
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
      return this.visitBinaryOperation(node);
    }

    if (node instanceof UnaryOperation) {
      return this.visitUnaryOperation(node);
    }

    if (node instanceof Numeral) {
      return this.visitNumeral(node);
    }

    if (node instanceof VariableAssigment) {
      return this.visitVariableAssigment(node);
    }

    if (node instanceof VariableAccess) {
      return this.visitVariableAccess(node);
    }

    throw new RuntimeError(
      `Unsupported AST node type ${node.constructor.name}`
    );
  }

  private visitProgram(program: Program): LuckyObject {
    let result: LuckyObject = new LuckyNumber(0);

    program.statements.forEach((instruction) => {
      result = this.visit(instruction);
    });

    return result;
  }

  private visitFunctionDeclaration(node: FunctionDeclaration) {
    const luckyFunction = new LuckyFunction(node.parameters, node.statements);

    if (node.name) {
      this.symbolTable.set(node.name, luckyFunction);
    }

    return luckyFunction;
  }

  private visitFunctionCall(node: FunctionCall): LuckyObject {
    const { name } = node;

    if (!this.symbolTable.has(name)) {
      throw new RuntimeError(`Undefined function ${name}`);
    }

    const luckyFunction = this.symbolTable.get(name);

    if (!(luckyFunction instanceof LuckyFunction)) {
      throw new RuntimeError(`The given identifier '${name}' is not callable`);
    }

    if (luckyFunction.arity !== node.args.length) {
      throw new RuntimeError(
        `Function ${name} takes exactly ${luckyFunction.arity} parameters`
      );
    }

    for (const [index, parameter] of luckyFunction.parameters.entries()) {
      const argument = node.args[index];
      this.symbolTable.set(parameter, this.visit(argument));
    }

    this.enterScope();

    for (const statement of luckyFunction.statements) {
      if (statement instanceof ReturnStatement) {
        this.exitScope();
        return this.visit(statement.expression);
      }

      this.visit(statement);
    }

    this.exitScope();

    return new LuckyNumber(0);
  }

  private visitBinaryOperation(node: BinaryOperation): LuckyObject {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    // TODO: Think about better typings for the operators
    switch (node.operator) {
      case "+":
        return left.add(right);
      case "-":
        return left.sub(right);
      case "*":
        return left.mul(right);
      case "/":
        return left.div(right);
      case "**":
        return left.pow(right);
      default:
        throw new RuntimeError(`Unsupported operation ${node.operator}`);
    }
  }

  private visitUnaryOperation(node: UnaryOperation) {
    const value = this.visit(node.child);

    switch (node.operator) {
      case "+":
        return value;
      case "-":
        return value.mul(new LuckyNumber(-1));
      default:
        throw new RuntimeError(`Unsupported unary operation ${node.operator}`);
    }
  }

  private visitNumeral(node: Numeral): LuckyNumber {
    const raw = node.value.replace(/_/g, "");
    const value = parseFloat(raw);

    return new LuckyNumber(value);
  }

  private visitVariableAssigment(node: VariableAssigment): LuckyObject {
    const value = this.visit(node.value);
    this.symbolTable.set(node.name, value);

    return value;
  }

  private visitVariableAccess(node: VariableAccess) {
    const value = this.symbolTable.get(node.name);

    if (value === undefined) {
      throw new NameError(node.name);
    }

    return value;
  }

  private enterScope(): void {
    this.symbolTable = new SymbolTable(this.symbolTable);
  }

  private exitScope(): void {
    const parent = this.symbolTable.parent;

    if (parent) {
      this.symbolTable = parent;
    }
  }
}
