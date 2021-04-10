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
import { LuckyObject, LuckyNumber, LuckyFunction } from "./LuckyFunction";
import { SymbolTable } from "./SymbolTable";

export class Interpreter {
  constructor(
    public readonly node: AstNode,
    private scope = new SymbolTable()
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

    program.statements.forEach((statements) => {
      result = this.visit(statements);
    });

    return result;
  }

  private visitFunctionDeclaration(node: FunctionDeclaration) {
    const luckyFunction = new LuckyFunction(this.scope, node.parameters, node.instructions);

    if (node.name) {
      this.scope.set(node.name, luckyFunction);
    }

    return luckyFunction;
  }

  private visitFunctionCall(node: FunctionCall): LuckyObject {
    const { name } = node;

    if (!this.scope.has(name)) {
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
      this.scope.set(parameter, this.visit(argument));
    }

    let result = new LuckyNumber(0);

    // TODO: Actually it's not that bad idea. It just need some polish
    this.switchScope(luckyFunction.scope, () => {
      luckyFunction.instructions.forEach((instruction) => {
        // TODO: Bring back return (use reduce or something?)
        result = this.visit(instruction);
      });
    });

    return result;
  }

  private switchScope(scope: SymbolTable, fn: () => void) {
    const prevScope = this.scope;
    this.scope = scope;

    this.enterScope();
    fn();
    this.exitScope();

    this.scope = prevScope;
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
    this.scope.set(node.name, value);

    return value;
  }

  private visitVariableAccess(node: VariableAccess) {
    const value = this.scope.get(node.name);

    // TODO: Maybe `get` should throw an error?
    if (value === undefined) {
      throw new NameError(node.name);
    }

    return value;
  }

  private enterScope(): void {
    this.scope = new SymbolTable(this.scope);
  }

  private exitScope(): void {
    const parent = this.scope.parent;

    if (parent) {
      this.scope = parent;
    }
  }
}
