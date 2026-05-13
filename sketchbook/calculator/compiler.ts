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
  const instructions: Instruction[] = [];
  const defined = new Set<string>();

  function visitExpr(expr: Expr): void {
    if (expr instanceof Identifier) {
      if (!defined.has(expr.name)) {
        throw new Error(`Undefined variable '${expr.name}'`);
      }
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

    if (stmt instanceof LetStmt) {
      visitExpr(stmt.expr);
      instructions.push({
        op: "STORE",
        name: stmt.name,
      });
      defined.add(stmt.name);
    }

    if (stmt instanceof ExprStmt) {
      visitExpr(stmt.expr);
      if (!isLast) {
        instructions.push({ op: "POP" });
      }
    }
  });

  return instructions;
}
