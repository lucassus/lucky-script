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
        instructions.push({ opcode: expr.op === "not" ? "NOT" : "NEG" });
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

  function emitStmt(stmt: Stmt, keepOnStack: boolean): void {
    switch (stmt.kind) {
      case "ExprStmt":
        visit(stmt.expr);
        if (!keepOnStack) {
          instructions.push({ opcode: "POP" });
        }
        break;

      case "IfStmt": {
        visit(stmt.condition);
        const toElsePc = instructions.length;
        instructions.push({ opcode: "JMP_IF_ZERO", target: 0 });

        stmt.consequence.forEach((inner) => emitStmt(inner, keepOnStack));

        let toEndPc: number | undefined;
        if (stmt.alternative) {
          toEndPc = instructions.length;
          instructions.push({ opcode: "JMP", target: 0 });
        }

        instructions[toElsePc] = {
          opcode: "JMP_IF_ZERO",
          target: instructions.length,
        };

        if (stmt.alternative) {
          stmt.alternative.forEach((inner) => emitStmt(inner, keepOnStack));

          instructions[toEndPc!] = {
            opcode: "JMP",
            target: instructions.length,
          };
        }
        break;
      }
    }
  }

  program.forEach((stmt, index) => {
    const isLast = index === program.length - 1;
    const keepOnStack = isLast && stmt.kind === "ExprStmt";
    emitStmt(stmt, keepOnStack);
  });

  instructions.push({ opcode: "HALT" });

  return instructions;
}
