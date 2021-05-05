import { AstNode, BinaryOperation, Numeral, UnaryOperation } from "../Parser";
import {
  FunctionCall,
  FunctionDeclaration,
  Program,
  ReturnStatement,
  VariableAccess,
  VariableAssigment,
} from "../Parser/AstNode";
import { RuntimeError } from "./errors";
import { LuckyFunction, LuckyNumber, LuckyObject, LuckyNone } from "./objects";
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
    let result: LuckyObject = LuckyNone.Instance;

    program.statements.forEach((statements) => {
      result = this.visit(statements);
    });

    return result;
  }

  private visitFunctionDeclaration(node: FunctionDeclaration): LuckyObject {
    const { name } = node;

    const luckyFunction = new LuckyFunction(
      this.scope,
      name,
      node.parameters,
      node.statements
    );

    if (name) {
      this.scope.set(name, luckyFunction);

      return LuckyNone.Instance;
    }

    return luckyFunction;
  }

  private visitFunctionCall(functionCall: FunctionCall): LuckyObject {
    const { name } = functionCall;

    const luckyFunction = this.scope.lookup(name);

    if (!(luckyFunction instanceof LuckyFunction)) {
      throw new RuntimeError(`The given identifier '${name}' is not callable`);
    }

    if (luckyFunction.arity !== functionCall.args.length) {
      throw new RuntimeError(
        `Function ${name} takes exactly ${luckyFunction.arity} parameters`
      );
    }

    const fnScope = luckyFunction.scope.createChild();

    for (const [index, parameter] of luckyFunction.parameters.entries()) {
      const argument = functionCall.args[index];
      fnScope.setLocal(parameter, this.visit(argument));
    }

    return this.withScope(fnScope, () => {
      for (const statement of luckyFunction.statements) {
        if (statement instanceof ReturnStatement) {
          return this.visit(statement.expression);
        }

        this.visit(statement);
      }

      return LuckyNone.Instance;
    });
  }

  private withScope(scope: SymbolTable, fn: () => LuckyObject) {
    const prevScope = this.scope;
    this.scope = scope;

    const result = fn();

    this.scope = prevScope;
    return result;
  }

  private visitBinaryOperation(node: BinaryOperation): LuckyObject {
    const left = this.visit(node.left);
    const right = this.visit(node.right);

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
        throw new RuntimeError(`Unsupported operator ${node.operator}`);
    }
  }

  private visitUnaryOperation(node: UnaryOperation): LuckyObject {
    const value = this.visit(node.child);

    switch (node.operator) {
      case "+":
        return value;
      case "-":
        return value.mul(new LuckyNumber(-1));
      default:
        throw new RuntimeError(`Unsupported unary operator ${node.operator}`);
    }
  }

  private visitNumeral(node: Numeral): LuckyNumber {
    const raw = node.value.replace(/_/g, "");
    const value = parseFloat(raw);

    return new LuckyNumber(value);
  }

  private visitVariableAssigment(node: VariableAssigment): LuckyObject {
    // TODO: Consider adding `this.visitExpression(code.value)`
    const value = this.visit(node.value);
    this.scope.set(node.name, value);

    return value;
  }

  private visitVariableAccess(node: VariableAccess): LuckyObject {
    return this.scope.lookup(node.name);
  }
}
