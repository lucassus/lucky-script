import type { Expr, Program, Stmt } from "./parser";
import { BinaryExpr, NumberLiteral, UnaryExpr } from "./parser";

type Instruction =
  | { op: "push"; constantIndex: number }
  | { op: "add" }
  | { op: "sub" }
  | { op: "neg" }
  | { op: "mul" }
  | { op: "div" };

export type Bytecode = {
  constants: number[];
  instructions: Instruction[];
};

export function compile(program: Program): Bytecode {
  const constants: number[] = [];
  const instructions: Instruction[] = [];

  function visit(expr: Expr): void {
    if (expr instanceof BinaryExpr) {
      visit(expr.left);
      visit(expr.right);
      const op =
        expr.operator === "+"
          ? "add"
          : expr.operator === "-"
            ? "sub"
            : expr.operator === "*"
              ? "mul"
              : "div";
      instructions.push({ op });
    }

    if (expr instanceof UnaryExpr) {
      visit(expr.operand);
      instructions.push({ op: "neg" });
    }

    if (expr instanceof NumberLiteral) {
      constants.push(expr.value);
      instructions.push({ op: "push", constantIndex: constants.length - 1 });
    }
  }

  program.body.forEach((stmt: Stmt) => visit(stmt.expr));

  return { constants, instructions };
}
