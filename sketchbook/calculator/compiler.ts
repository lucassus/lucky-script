import type { Expr, Program } from "./ast";
import {
  AssignExpr,
  BinaryExpr,
  CompareExpr,
  ExprStmt,
  Identifier,
  NumberLiteral,
  UnaryExpr,
} from "./ast";
import type { Bytecode, Instruction } from "./bytecode";

export function compile(program: Program): Bytecode {
  const instructions: Instruction[] = [];

  function visitExpr(expr: Expr): void {
    if (expr instanceof AssignExpr) {
      visitExpr(expr.value);
      instructions.push({ op: "DUP" });
      instructions.push({ op: "STORE", name: expr.name });
      return;
    }

    if (expr instanceof Identifier) {
      instructions.push({ op: "LOAD", name: expr.name });
      return;
    }

    if (expr instanceof BinaryExpr) {
      visitExpr(expr.left);
      visitExpr(expr.right);
      const op =
        expr.operator === "+"
          ? "ADD"
          : expr.operator === "-"
            ? "SUB"
            : expr.operator === "*"
              ? "MUL"
              : "DIV";
      instructions.push({ op });
      return;
    }

    if (expr instanceof CompareExpr) {
      visitExpr(expr.left);
      visitExpr(expr.right);
      const op =
        expr.operator === ">"
          ? "GT"
          : expr.operator === "<"
            ? "LT"
            : expr.operator === ">="
              ? "GTE"
              : expr.operator === "<="
                ? "LTE"
                : expr.operator === "=="
                  ? "EQ"
                  : "NEQ";
      instructions.push({ op });
      return;
    }

    if (expr instanceof UnaryExpr) {
      visitExpr(expr.operand);
      instructions.push({ op: "NEG" });
      return;
    }

    if (expr instanceof NumberLiteral) {
      instructions.push({ op: "PUSH", value: expr.value });
    }
  }

  const stmts = program.body;
  stmts.forEach((stmt, index) => {
    const isLast = index === stmts.length - 1;

    if (stmt instanceof ExprStmt) {
      visitExpr(stmt.expr);
      if (!isLast) {
        instructions.push({ op: "POP" });
      }
    }
  });

  return instructions;
}
