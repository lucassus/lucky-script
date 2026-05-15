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

      case "Logical": {
        visit(expr.left);
        // Duplicate the left value. We need it as the final result if we short-circuit!
        instructions.push({ opcode: "DUP" });

        if (expr.op === "and") {
          // If left is falsy (0), short-circuit to the end.
          const jmpInstruction: Instruction = {
            opcode: "JMP_IF_ZERO",
            target: 0,
          };
          instructions.push(jmpInstruction);

          // We didn't jump, meaning left is truthy. Discard it.
          instructions.push({ opcode: "POP" });
          visit(expr.right);

          jmpInstruction.target = instructions.length;
        } else {
          // For 'or', we want to short-circuit if left is TRUTHY.
          // We can invert the duplicated value with NOT, then JMP_IF_ZERO!
          instructions.push({ opcode: "NOT" });
          const jmpInstruction: Instruction = {
            opcode: "JMP_IF_ZERO",
            target: 0,
          };
          instructions.push(jmpInstruction);

          // We didn't jump, meaning left was falsy. Discard it.
          instructions.push({ opcode: "POP" });
          visit(expr.right);

          jmpInstruction.target = instructions.length;
        }
        return;
      }

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

  let loopDepth = 0;
  const breakStatements: Instruction[][] = [];
  const continueStatements: Instruction[][] = [];

  function emitStmt(stmt: Stmt, keepOnStack: boolean): void {
    switch (stmt.kind) {
      case "ExprStmt":
        visit(stmt.expr);
        if (!keepOnStack) {
          instructions.push({ opcode: "POP" });
        }
        break;

      case "BreakStmt": {
        if (loopDepth === 0) {
          throw new Error("break statement outside of a loop");
        }
        const jmpInstruction: Instruction = {
          opcode: "JMP",
          target: 0,
        };
        instructions.push(jmpInstruction);
        breakStatements[loopDepth - 1]!.push(jmpInstruction);
        break;
      }

      case "ContinueStmt": {
        if (loopDepth === 0) {
          throw new Error("continue statement outside of a loop");
        }
        const jmpInstruction: Instruction = {
          opcode: "JMP",
          target: 0,
        };
        instructions.push(jmpInstruction);
        continueStatements[loopDepth - 1]!.push(jmpInstruction);
        break;
      }

      case "IfStmt": {
        visit(stmt.condition);

        const jmpIfZeroInstruction: Instruction = {
          opcode: "JMP_IF_ZERO",
          target: 0, // We will update this later
        };
        instructions.push(jmpIfZeroInstruction);

        stmt.consequence.forEach((inner) => emitStmt(inner, keepOnStack));

        if (stmt.alternative) {
          const jmpInstruction: Instruction = {
            opcode: "JMP",
            target: 0, // We will update this later
          };
          instructions.push(jmpInstruction);

          jmpIfZeroInstruction.target = instructions.length;

          stmt.alternative.forEach((inner) => emitStmt(inner, keepOnStack));

          jmpInstruction.target = instructions.length;
        } else {
          // Jump to the end of the if block
          jmpIfZeroInstruction.target = instructions.length;
        }

        break;
      }

      case "WhileStmt": {
        const loopStart = instructions.length;
        visit(stmt.condition);

        const jmpIfZeroInstruction: Instruction = {
          opcode: "JMP_IF_ZERO",
          target: 0,
        };
        instructions.push(jmpIfZeroInstruction);

        loopDepth++;
        breakStatements.push([]);
        continueStatements.push([]);

        stmt.body.forEach((inner) => emitStmt(inner, false));

        const jmpInstruction: Instruction = {
          opcode: "JMP",
          target: loopStart,
        };
        instructions.push(jmpInstruction);

        const loopEnd = instructions.length;
        jmpIfZeroInstruction.target = loopEnd;

        // Patch breaks and continues
        const currentBreaks = breakStatements.pop()!;
        for (const breakJmp of currentBreaks) {
          if (breakJmp.opcode === "JMP") {
            breakJmp.target = loopEnd;
          }
        }
        const currentContinues = continueStatements.pop()!;
        for (const continueJmp of currentContinues) {
          if (continueJmp.opcode === "JMP") {
            continueJmp.target = loopStart;
          }
        }

        loopDepth--;

        // While loop is a statement and does not yield a value.
        // Wait, what if it's the last statement? We need to push 0 or keepOnStack handling?
        // Let's just push 0 if keepOnStack is true, wait, standard calculator vm doesn't have an UNDEFINED value.
        // But the previous implementation ExprStmt checks keepOnStack.
        // For if statement, it also doesn't handle keepOnStack? Ah, keepOnStack in if statement is passed down to consequence/alternative.
        // For while, we just don't push anything. It's a loop. But the top level loop might need to keepOnStack if we change things?
        // Let's see how if statement is handled: it passes keepOnStack to children.
        // For while, the children are not returned. We passed false to body.
        // If while loop is the last statement, what should we return? Let's just push 0 if keepOnStack.
        if (keepOnStack) {
          instructions.push({ opcode: "PUSH", value: 0 }); // Default value for while loop
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
