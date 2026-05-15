import type { Expr, Program, Stmt } from "../parser";
import type { Bytecode, Instruction } from "./bytecode";

export function compile(program: Program): Bytecode {
  const instructions: Instruction[] = [];

  function visit(expr: Expr): void {
    switch (expr.kind) {
      case "Assign":
        visit(expr.value);
        instructions.push({ opcode: "DUP" });
        instructions.push({ opcode: "STORE", name: expr.name });
        return;

      case "Identifier":
        instructions.push({ opcode: "LOAD", name: expr.name });
        return;

      case "Arithmetic":
        visit(expr.left);
        visit(expr.right);
        instructions.push({
          opcode:
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
        instructions.push({ opcode: expr.op === "and" ? "AND" : "OR" });
        return;

      case "Unary":
        visit(expr.expr);
        if (expr.op === "not") {
          instructions.push({ opcode: "NOT" });
        } else if (expr.op === "-") {
          instructions.push({ opcode: "NEG" });
        }
        return;

      case "Compare":
        visit(expr.left);
        visit(expr.right);
        instructions.push({
          opcode:
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
        instructions.push({ opcode: "PUSH", value: expr.value });
    }
  }

  function emitStmt(stmt: Stmt, isLastInProgram: boolean): void {
    switch (stmt.kind) {
      case "ExprStmt":
        visit(stmt.expr);
        if (!isLastInProgram) {
          instructions.push({ opcode: "POP" });
        }
        break;

      case "IfStmt": {
        visit(stmt.condition);
        const jumpPc = instructions.length;
        instructions.push({ opcode: "JMP_IF_ZERO", target: 0 });
        for (let i = 0; i < stmt.body.length; i++) {
          emitStmt(
            stmt.body[i]!,
            i === stmt.body.length - 1 && isLastInProgram,
          );
        }
        instructions[jumpPc] = {
          opcode: "JMP_IF_ZERO",
          target: instructions.length,
        };
        break;
      }
    }
  }

  program.forEach((stmt, index) => {
    emitStmt(stmt, index === program.length - 1);
  });

  return instructions;
}
