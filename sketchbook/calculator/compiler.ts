import type { Expr, Program } from "./ast";
import {
  BinaryExpr,
  ExprStmt,
  Identifier,
  LetStmt,
  NumberLiteral,
  UnaryExpr,
} from "./ast";
import type { Bytecode, Instruction } from "./bytecode";

export function compile(program: Program): Bytecode {
  const constants: number[] = [];
  const names: string[] = [];
  const instructions: Instruction[] = [];
  const defined = new Set<string>();

  function symbolIndex(symbol: string): number {
    const existing = names.indexOf(symbol);
    if (existing !== -1) {
      return existing;
    }
    names.push(symbol);
    return names.length - 1;
  }

  function visitExpr(expr: Expr): void {
    if (expr instanceof Identifier) {
      if (!defined.has(expr.name)) {
        throw new Error(`Undefined variable '${expr.name}'`);
      }
      instructions.push({ op: "load", nameIndex: symbolIndex(expr.name) });
      return;
    }

    if (expr instanceof BinaryExpr) {
      visitExpr(expr.left);
      visitExpr(expr.right);
      const op =
        expr.operator === "+"
          ? "add"
          : expr.operator === "-"
            ? "sub"
            : expr.operator === "*"
              ? "mul"
              : "div";
      instructions.push({ op });
      return;
    }

    if (expr instanceof UnaryExpr) {
      visitExpr(expr.operand);
      instructions.push({ op: "neg" });
      return;
    }

    if (expr instanceof NumberLiteral) {
      constants.push(expr.value);
      instructions.push({ op: "push", constantIndex: constants.length - 1 });
    }
  }

  program.body.forEach((stmt, index) => {
    const isLast = index === program.body.length - 1;

    if (stmt instanceof LetStmt) {
      visitExpr(stmt.expr);
      if (isLast) {
        instructions.push({ op: "dup" });
      }
      instructions.push({
        op: "storePop",
        nameIndex: symbolIndex(stmt.name),
      });
      defined.add(stmt.name);
    }

    if (stmt instanceof ExprStmt) {
      visitExpr(stmt.expr);
      return;
    }
  });

  return { constants, names, instructions };
}
