import type { Expr, Program, Stmt } from "../parser";
import type { Bytecode, FunctionProto, Instruction } from "./bytecode";

export function compile(program: Program): Bytecode {
  const main: FunctionProto = { name: "__main", params: [], code: [] };
  const functions: FunctionProto[] = [];

  // knownLocalsStack: compile-time shadow of the Environment chain.
  // Index 0 = innermost (current) scope, last = global scope.
  // Used only for "is this name visible?" checks — it never affects code shape.
  const knownLocalsStack: Set<string>[] = [new Set<string>()];

  function currentScope(): Set<string> {
    return knownLocalsStack[0]!;
  }

  // Returns true if name is visible in any enclosing scope at compile time.
  function isKnown(name: string): boolean {
    return knownLocalsStack.some((s) => s.has(name));
  }

  let targetCode = main.code;
  let inFunction = false;

  let loopDepth = 0;
  const breakStatements: Instruction[][] = [];
  const continueStatements: Instruction[][] = [];

  function visit(expr: Expr): void {
    switch (expr.kind) {
      case "Call": {
        // All calls go through LOAD (get the closure value) + CALL (invoke it).
        // Arity checking is deferred to runtime via ArityMismatch.
        if (!isKnown(expr.name)) {
          throw new Error(`unknown name: ${expr.name}`);
        }
        targetCode.push({ opcode: "LOAD", name: expr.name });
        for (const arg of expr.args) {
          visit(arg);
        }
        targetCode.push({ opcode: "CALL", argc: expr.args.length });
        return;
      }

      case "Assign": {
        // Bare `x = e`: must already exist somewhere in the chain.
        if (!isKnown(expr.name)) {
          throw new Error(`unknown name: ${expr.name}`);
        }
        visit(expr.value);
        // DUP so the assignment expression still has a value on the stack.
        targetCode.push({ opcode: "DUP" });
        targetCode.push({ opcode: "ASSIGN", name: expr.name });
        return;
      }

      case "Identifier": {
        if (!isKnown(expr.name)) {
          throw new Error(`unknown name: ${expr.name}`);
        }
        targetCode.push({ opcode: "LOAD", name: expr.name });
        return;
      }

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

  function compileFunDef(funStmt: Extract<Stmt, { kind: "FunDef" }>): void {
    // Duplicate-name guard within the current scope.
    if (currentScope().has(funStmt.name)) {
      throw new Error(`duplicate function: ${funStmt.name}`);
    }

    const fnIndex = functions.length;
    const proto: FunctionProto = {
      name: funStmt.name,
      params: [...funStmt.params],
      code: [],
    };
    functions.push(proto);

    // Register name in the enclosing scope BEFORE compiling the body so that
    // the function can call itself recursively. This is not full hoisting —
    // only the function's own name is pre-registered, not any later defs.
    currentScope().add(funStmt.name);

    // Save compilation state and switch into the function's body.
    const savedCode = targetCode;
    const savedInFunction = inFunction;

    targetCode = proto.code;
    inFunction = true;

    // Push a new scope containing only the parameters.
    const paramScope = new Set<string>(funStmt.params);
    knownLocalsStack.unshift(paramScope);

    for (const inner of funStmt.body) {
      emitStmt(inner, false);
    }

    // Implicit return 0 if the body falls through without a return statement.
    targetCode.push({ opcode: "PUSH", value: 0 });
    targetCode.push({ opcode: "RETURN" });

    knownLocalsStack.shift();
    targetCode = savedCode;
    inFunction = savedInFunction;

    // Emit the runtime instructions that create the closure and bind it.
    targetCode.push({ opcode: "MAKE_CLOSURE", fnIndex });
    targetCode.push({ opcode: "DEFINE", name: funStmt.name });
  }

  function emitStmt(stmt: Stmt, keepOnStack: boolean): void {
    switch (stmt.kind) {
      case "LetStmt": {
        // `let x = e` — define a new binding in the current scope.
        visit(stmt.value);
        currentScope().add(stmt.name);
        targetCode.push({ opcode: "DEFINE", name: stmt.name });
        break;
      }

      case "FunDef": {
        compileFunDef(stmt);
        break;
      }

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
        const jmpInstruction: Instruction = { opcode: "JMP", target: 0 };
        targetCode.push(jmpInstruction);
        breakStatements[loopDepth - 1]!.push(jmpInstruction);
        break;
      }

      case "ContinueStmt": {
        if (loopDepth === 0) {
          throw new Error("continue statement outside of a loop");
        }
        const jmpInstruction: Instruction = { opcode: "JMP", target: 0 };
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

        stmt.consequence.forEach((inner) => emitStmt(inner, keepOnStack));

        if (stmt.alternative) {
          const jmpInstruction: Instruction = { opcode: "JMP", target: 0 };
          targetCode.push(jmpInstruction);

          jmpIfZeroInstruction.target = targetCode.length;

          stmt.alternative.forEach((inner) => emitStmt(inner, keepOnStack));

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

        stmt.body.forEach((inner) => emitStmt(inner, false));

        const jmpInstruction: Instruction = {
          opcode: "JMP",
          target: loopStart,
        };
        targetCode.push(jmpInstruction);

        const loopEnd = targetCode.length;
        jmpIfZeroInstruction.target = loopEnd;

        const currentBreaks = breakStatements.pop()!;
        for (const breakJmp of currentBreaks) {
          if (breakJmp.opcode === "JMP") breakJmp.target = loopEnd;
        }
        const currentContinues = continueStatements.pop()!;
        for (const continueJmp of currentContinues) {
          if (continueJmp.opcode === "JMP") continueJmp.target = loopStart;
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
    emitStmt(stmt, isLast && stmt.kind === "ExprStmt");
  }

  main.code.push({ opcode: "HALT" });

  return { main, functions };
}
