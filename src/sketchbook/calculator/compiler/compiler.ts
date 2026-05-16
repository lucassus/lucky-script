import type { Expr, Program, Stmt } from "../parser";
import type { BytecodeModule, FunctionProto, Instruction } from "./bytecode";

export function compile(program: Program): BytecodeModule {
  const main: FunctionProto = { name: "__main", params: [], code: [] };
  const functions: FunctionProto[] = [];
  const functionTable = new Map<string, number>();

  for (const stmt of program) {
    if (stmt.kind === "FunDef") {
      if (functionTable.has(stmt.name)) {
        throw new Error(`duplicate function: ${stmt.name}`);
      }
      const idx = functions.length;
      functionTable.set(stmt.name, idx);
      functions.push({
        name: stmt.name,
        params: [...stmt.params],
        code: [],
      });
    }
  }

  let targetCode = main.code;
  let inFunction = false;
  let knownLocals = new Set<string>();
  let controlDepth = 0;

  let loopDepth = 0;
  const breakStatements: Instruction[][] = [];
  const continueStatements: Instruction[][] = [];

  function visit(expr: Expr): void {
    switch (expr.kind) {
      case "Call": {
        const fnIndex = functionTable.get(expr.name);
        if (fnIndex === undefined) {
          throw new Error(`unknown function: ${expr.name}`);
        }
        const callee = functions[fnIndex]!;
        const arity = callee.params.length;
        if (expr.args.length !== arity) {
          throw new Error(
            `arity mismatch: ${expr.name} expects ${arity} arguments, got ${expr.args.length}`,
          );
        }
        for (const arg of expr.args) {
          visit(arg);
        }
        targetCode.push({ opcode: "CALL", fnIndex, argc: expr.args.length });
        return;
      }

      case "Assign":
        visit(expr.value);
        targetCode.push({ opcode: "DUP" });
        if (inFunction) {
          knownLocals.add(expr.name);
          targetCode.push({ opcode: "STORE_L", name: expr.name });
        } else {
          targetCode.push({ opcode: "STORE_G", name: expr.name });
        }
        return;

      case "Identifier":
        if (inFunction) {
          if (!knownLocals.has(expr.name)) {
            throw new Error(`unknown name: ${expr.name}`);
          }
          targetCode.push({ opcode: "LOAD_L", name: expr.name });
        } else {
          targetCode.push({ opcode: "LOAD_G", name: expr.name });
        }
        return;

      case "Arithmetic":
        visit(expr.left);
        visit(expr.right);
        targetCode.push({
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
        targetCode.push({ opcode: "DUP" });

        if (expr.op === "and") {
          const jmpInstruction: Instruction = {
            opcode: "JMP_IF_ZERO",
            target: 0,
          };
          targetCode.push(jmpInstruction);

          targetCode.push({ opcode: "POP" });
          visit(expr.right);

          jmpInstruction.target = targetCode.length;
        } else {
          targetCode.push({ opcode: "NOT" });
          const jmpInstruction: Instruction = {
            opcode: "JMP_IF_ZERO",
            target: 0,
          };
          targetCode.push(jmpInstruction);

          targetCode.push({ opcode: "POP" });
          visit(expr.right);

          jmpInstruction.target = targetCode.length;
        }
        return;
      }

      case "Unary":
        visit(expr.expr);
        targetCode.push({ opcode: expr.op === "not" ? "NOT" : "NEG" });
        return;

      case "Compare":
        visit(expr.left);
        visit(expr.right);
        targetCode.push({
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
        targetCode.push({ opcode: "PUSH", value: expr.value });
        return;
    }
  }

  function compileFunBody(funStmt: Extract<Stmt, { kind: "FunDef" }>): void {
    if (inFunction || controlDepth !== 0) {
      throw new Error("def is only allowed at the top level");
    }

    const fnIndex = functionTable.get(funStmt.name)!;
    const proto = functions[fnIndex]!;

    const savedCode = targetCode;
    const savedInFunction = inFunction;
    const savedLocals = knownLocals;

    targetCode = proto.code;
    inFunction = true;
    knownLocals = new Set(funStmt.params);

    for (const inner of funStmt.body) {
      emitStmt(inner, false);
    }

    targetCode.push({ opcode: "PUSH", value: 0 });
    targetCode.push({ opcode: "RETURN" });

    targetCode = savedCode;
    inFunction = savedInFunction;
    knownLocals = savedLocals;
  }

  function emitStmt(stmt: Stmt, keepOnStack: boolean): void {
    switch (stmt.kind) {
      case "FunDef":
        throw new Error("def is only allowed at the top level");

      case "ReturnStmt": {
        if (!inFunction) {
          throw new Error("return outside of a function");
        }
        if (stmt.value) {
          visit(stmt.value);
        } else {
          targetCode.push({ opcode: "PUSH", value: 0 });
        }
        targetCode.push({ opcode: "RETURN" });
        break;
      }

      case "ExprStmt":
        visit(stmt.expr);
        if (!keepOnStack) {
          targetCode.push({ opcode: "POP" });
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
        targetCode.push(jmpInstruction);
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
        targetCode.push(jmpInstruction);
        continueStatements[loopDepth - 1]!.push(jmpInstruction);
        break;
      }

      case "IfStmt": {
        visit(stmt.condition);

        const jmpIfZeroInstruction: Instruction = {
          opcode: "JMP_IF_ZERO",
          target: 0,
        };
        targetCode.push(jmpIfZeroInstruction);

        controlDepth++;
        stmt.consequence.forEach((inner) => emitStmt(inner, keepOnStack));
        controlDepth--;

        if (stmt.alternative) {
          const jmpInstruction: Instruction = {
            opcode: "JMP",
            target: 0,
          };
          targetCode.push(jmpInstruction);

          jmpIfZeroInstruction.target = targetCode.length;

          controlDepth++;
          stmt.alternative.forEach((inner) => emitStmt(inner, keepOnStack));
          controlDepth--;

          jmpInstruction.target = targetCode.length;
        } else {
          jmpIfZeroInstruction.target = targetCode.length;
        }

        break;
      }

      case "WhileStmt": {
        const loopStart = targetCode.length;
        visit(stmt.condition);

        const jmpIfZeroInstruction: Instruction = {
          opcode: "JMP_IF_ZERO",
          target: 0,
        };
        targetCode.push(jmpIfZeroInstruction);

        loopDepth++;
        breakStatements.push([]);
        continueStatements.push([]);

        controlDepth++;
        stmt.body.forEach((inner) => emitStmt(inner, false));
        controlDepth--;

        const jmpInstruction: Instruction = {
          opcode: "JMP",
          target: loopStart,
        };
        targetCode.push(jmpInstruction);

        const loopEnd = targetCode.length;
        jmpIfZeroInstruction.target = loopEnd;

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

        if (keepOnStack) {
          targetCode.push({ opcode: "PUSH", value: 0 });
        }
        break;
      }
    }
  }

  for (let i = 0; i < program.length; i++) {
    const stmt = program[i]!;
    const isLast = i === program.length - 1;
    if (stmt.kind === "FunDef") {
      compileFunBody(stmt);
    } else {
      emitStmt(stmt, isLast && stmt.kind === "ExprStmt");
    }
  }

  main.code.push({ opcode: "HALT" });

  return { main, functions };
}
