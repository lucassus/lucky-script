import { Return, RuntimeError } from "./errors";
import {
  LuckyFunction,
  LuckyNumber,
  LuckyObject,
  LuckyBoolean,
} from "./objects";
import { SymbolTable } from "./SymbolTable";
import { AstNode, BinaryOperation, Numeral, UnaryOperation } from "../Parser";
import {
  FunctionCall,
  FunctionDeclaration,
  IfStatement,
  Program,
  ReturnStatement,
  VariableAccess,
  VariableAssigment,
} from "../Parser/AstNode";

export class Interpreter {
  constructor(
    public readonly node: AstNode,
    private scope = new SymbolTable()
  ) {}

  run(): undefined | boolean | number {
    const luckyObject = this.visit(this.node);

    if (
      luckyObject instanceof LuckyNumber ||
      luckyObject instanceof LuckyBoolean
    ) {
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

    if (node instanceof IfStatement) {
      return this.visitIfStatement(node);
    }

    if (node instanceof ReturnStatement) {
      throw new Return(this.visit(node.expression));
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

  private visitFunctionDeclaration(node: FunctionDeclaration): LuckyFunction {
    const { name } = node;

    const luckyFunction = new LuckyFunction(
      this.scope,
      name,
      node.parameters,
      node.statements
    );

    if (name) {
      this.scope.set(name, luckyFunction);
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
        try {
          this.visit(statement);
        } catch (error) {
          if (error instanceof Return) {
            return error.result;
          }

          throw error;
        }
      }

      return new LuckyNumber(0);
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
      case "<":
        return left.lt(right);
      case "<=":
        return left.lte(right);
      case "==":
        return left.eq(right);
      case ">=":
        return left.gte(right);
      case ">":
        return left.gt(right);
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

  private visitIfStatement(node: IfStatement) {
    const testResult = this.visit(node.condition);

    // TODO: It should create a new scope
    if (testResult.toBoolean() === LuckyBoolean.True) {
      for (const statement of node.thenBranch) {
        this.visit(statement);
      }
    }

    // TODO: A workaround, if statement, like the other statement, should not return a value
    // TODO: Introduce Nothing keyword
    return new LuckyNumber(0);
  }
}
