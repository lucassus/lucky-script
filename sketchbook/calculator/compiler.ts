import type { Expr, Program } from "./ast";
import type { Bytecode, Instruction } from "./bytecode";

export function compile(program: Program): Bytecode {
  const instructions: Instruction[] = [];

  function visit(expr: Expr): void {
    switch (expr.kind) {
      case "Assign":
        visit(expr.value);
        instructions.push({ op: "DUP" });
        instructions.push({ op: "STORE", name: expr.name });
        return;

      case "Variable":
        instructions.push({ op: "LOAD", name: expr.name });
        return;

      case "Arithmetic":
        visit(expr.left);
        visit(expr.right);
        instructions.push({
          op:
            expr.op === "+"
              ? "ADD"
              : expr.op === "-"
                ? "SUB"
                : expr.op === "*"
                  ? "MUL"
                  : "DIV",
        });
        return;

      case "Logical":
        visit(expr.left);
        visit(expr.right);
        instructions.push({ op: expr.op === "and" ? "AND" : "OR" });
        return;

      case "Unary":
        visit(expr.expr);
        if (expr.op === "not") {
          instructions.push({ op: "NOT" });
        } else if (expr.op === "-") {
          instructions.push({ op: "NEG" });
        }
        return;

      case "Compare":
        visit(expr.left);
        visit(expr.right);
        instructions.push({
          op:
            expr.op === ">"
              ? "GT"
              : expr.op === "<"
                ? "LT"
                : expr.op === ">="
                  ? "GTE"
                  : expr.op === "<="
                    ? "LTE"
                    : expr.op === "=="
                      ? "EQ"
                      : "NEQ",
        });
        return;

      case "Literal":
        instructions.push({ op: "PUSH", value: expr.value });
    }
  }

  program.forEach((stmt, index) => {
    const isLast = index === program.length - 1;

    visit(stmt.expr);
    if (!isLast) {
      instructions.push({ op: "POP" });
    }
  });

  return instructions;
}
