import type { AstNode } from "../Parser";
import { BinaryOperation, Numeral, UnaryOperation } from "../Parser";
import {
  BooleanLiteral,
  BreakStatement,
  ContinueStatement,
  FunctionCall,
  FunctionDeclaration,
  IfStatement,
  NothingLiteral,
  Program,
  ReturnStatement,
  StringLiteral,
  VariableAccess,
  VariableAssigment,
  WhileStatement,
} from "../Parser/AstNode";
import { BUILTINS } from "./builtins";
import { Break, Continue, Return } from "./ControlFlow";
import { RuntimeError } from "./errors";
import type { LuckyObject } from "./objects";
import {
  LuckyBoolean,
  LuckyBuiltin,
  LuckyFunction,
  LuckyNothing,
  LuckyNumber,
  LuckyString,
} from "./objects";
import { SymbolTable } from "./SymbolTable";

export class Interpreter {
  constructor(
    public readonly node: AstNode,
    private scope = new SymbolTable(),
  ) {
    const frozenBuiltins = SymbolTable.createFrozenBuiltins(BUILTINS);
    this.scope.setParent(frozenBuiltins);
  }

  run(): undefined | boolean | number | string {
    const luckyObject = this.visit(this.node);

    if (luckyObject instanceof LuckyNumber) {
      return luckyObject.value;
    }

    if (luckyObject instanceof LuckyBoolean) {
      return luckyObject.value;
    }

    if (luckyObject instanceof LuckyString) {
      return luckyObject.value;
    }

    return undefined;
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

    if (node instanceof NothingLiteral) {
      return LuckyNothing.Instance;
    }

    if (node instanceof BooleanLiteral) {
      return this.visitBooleanLiteral(node);
    }

    if (node instanceof StringLiteral) {
      return this.visitStringLiteral(node);
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

    if (node instanceof WhileStatement) {
      return this.visitWhileStatement(node);
    }

    if (node instanceof BreakStatement) {
      return this.visitBreakStatement(node);
    }

    if (node instanceof ContinueStatement) {
      return this.visitContinueStatement(node);
    }

    if (node instanceof ReturnStatement) {
      throw new Return(this.visit(node.expression));
    }

    /* c8 ignore next 3 */
    throw new RuntimeError(
      `Unsupported AST node type ${node.constructor.name}`,
    );
  }

  private visitProgram(program: Program): LuckyObject {
    let result: LuckyObject = LuckyNothing.Instance;

    try {
      program.statements.forEach((statements) => {
        result = this.visit(statements);
      });
    } catch (error) {
      if (error instanceof Return) {
        throw new RuntimeError("Return statement outside function body");
      }
      throw error;
    }

    return result;
  }

  private visitFunctionDeclaration(node: FunctionDeclaration): LuckyFunction {
    const { name } = node;

    const luckyFunction = new LuckyFunction(
      this.scope,
      name,
      node.parameters,
      node.statements,
    );

    if (name) {
      this.scope.declare(name, luckyFunction);
    }

    return luckyFunction;
  }

  private visitFunctionCall(functionCall: FunctionCall): LuckyObject {
    const { name } = functionCall;

    const luckyFunction = this.scope.lookup(name);

    if (luckyFunction instanceof LuckyBuiltin) {
      if (luckyFunction.arity !== functionCall.args.length) {
        throw new RuntimeError(
          `Function ${name} takes exactly ${luckyFunction.arity} parameters`,
        );
      }
      const args = functionCall.args.map((arg) => this.visit(arg));
      return luckyFunction.call(args);
    }

    if (!(luckyFunction instanceof LuckyFunction)) {
      throw new RuntimeError(`The given identifier '${name}' is not callable`);
    }

    if (luckyFunction.arity !== functionCall.args.length) {
      throw new RuntimeError(
        `Function ${name} takes exactly ${luckyFunction.arity} parameters`,
      );
    }

    const fnScope = luckyFunction.scope.createChild(true);

    for (const [index, parameter] of luckyFunction.parameters.entries()) {
      const argument = functionCall.args[index]!;
      fnScope.declare(parameter, this.visit(argument));
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

      return LuckyNothing.Instance;
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
    // Short-circuit: false and <anything> is always false.
    if (node.operator === "and") {
      const left = this.visit(node.left);
      return left.toBoolean() === LuckyBoolean.False
        ? LuckyBoolean.False
        : this.visit(node.right).toBoolean();
    }

    // Short-circuit: true or <anything> is always true.
    if (node.operator === "or") {
      const left = this.visit(node.left);
      return left.toBoolean() === LuckyBoolean.True
        ? LuckyBoolean.True
        : this.visit(node.right).toBoolean();
    }

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
      case "!=":
        return left.neq(right);
      case ">=":
        return left.gte(right);
      case ">":
        return left.gt(right);
      /* c8 ignore next 2 */
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
      case "not":
        return LuckyBoolean.fromNative(
          value.toBoolean() === LuckyBoolean.False,
        );
      /* c8 ignore next 2 */
      default:
        throw new RuntimeError(`Unsupported unary operator ${node.operator}`);
    }
  }

  private visitNumeral(node: Numeral): LuckyNumber {
    const raw = node.value.replace(/_/g, "");
    const value = parseFloat(raw);

    return new LuckyNumber(value);
  }

  private visitBooleanLiteral(node: BooleanLiteral): LuckyBoolean {
    return LuckyBoolean.fromNative(node.value);
  }

  private visitStringLiteral(node: StringLiteral): LuckyString {
    const raw = node.value.slice(1, -1);
    const decoded = raw.replace(/\\(["\\n])/g, (_, c: string) =>
      c === "n" ? "\n" : c,
    );
    return new LuckyString(decoded);
  }

  private visitVariableAssigment(node: VariableAssigment): LuckyObject {
    const value = this.visit(node.value);

    switch (node.kind) {
      case "declaration":
        this.scope.declare(node.name, value);
        break;
      default:
        this.scope.reassign(node.name, value);
    }

    return value;
  }

  private visitVariableAccess(node: VariableAccess): LuckyObject {
    return this.scope.lookup(node.name);
  }

  private visitIfStatement(node: IfStatement) {
    const testResult = this.visit(node.condition);

    if (testResult.toBoolean() === LuckyBoolean.True) {
      for (const statement of node.thenBranch) {
        this.visit(statement);
      }
    } else if (node.elseBranch) {
      for (const statement of node.elseBranch) {
        this.visit(statement);
      }
    }

    return LuckyNothing.Instance;
  }

  private visitWhileStatement(node: WhileStatement): LuckyObject {
    outer: while (
      this.visit(node.condition).toBoolean() === LuckyBoolean.True
    ) {
      for (const statement of node.body) {
        try {
          this.visit(statement);
        } catch (e) {
          if (e instanceof Break) break outer;
          if (e instanceof Continue) continue outer;
          throw e;
        }
      }
    }

    return LuckyNothing.Instance;
  }

  private visitBreakStatement(_node: BreakStatement): never {
    throw new Break();
  }

  private visitContinueStatement(_node: ContinueStatement): never {
    throw new Continue();
  }
}
