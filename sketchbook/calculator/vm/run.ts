import type { Bytecode } from "../bytecode";
import { UndefinedVariable } from "./errors";
import { OperandStack } from "./OperandStack";

const DEFAULT_MAX_STACK_DEPTH = 10_000;

export type RunOptions = {
  /** Max stack slots; default {@link DEFAULT_MAX_STACK_DEPTH}. */
  maxStackDepth?: number;
};

export function run(
  bytecode: Bytecode,
  options?: RunOptions,
): number | undefined {
  const stack = new OperandStack(
    options?.maxStackDepth ?? DEFAULT_MAX_STACK_DEPTH,
  );
  const bindings = new Map<string, number>();

  let ip = 0;

  while (ip < bytecode.length) {
    const instr = bytecode[ip]!;
    ip += 1;

    switch (instr.op) {
      case "PUSH": {
        stack.push(instr.value);
        break;
      }

      case "LOAD": {
        const value = bindings.get(instr.name);
        if (value === undefined) {
          throw new UndefinedVariable(instr.name);
        }
        stack.push(value);
        break;
      }

      case "STORE": {
        const popped = stack.pop(instr.op);
        bindings.set(instr.name, popped);
        break;
      }

      case "POP": {
        stack.pop(instr.op);
        break;
      }

      case "ADD": {
        const right = stack.pop(instr.op);
        const left = stack.pop(instr.op);
        stack.push(left + right);
        break;
      }

      case "SUB": {
        const right = stack.pop(instr.op);
        const left = stack.pop(instr.op);
        stack.push(left - right);
        break;
      }

      case "MUL": {
        const right = stack.pop(instr.op);
        const left = stack.pop(instr.op);
        stack.push(left * right);
        break;
      }

      case "DIV": {
        const right = stack.pop(instr.op);
        const left = stack.pop(instr.op);
        stack.push(left / right);
        break;
      }

      case "NEG": {
        const value = stack.pop(instr.op);
        stack.push(-value);
        break;
      }

      default: {
        instr satisfies never;
      }
    }
  }

  return stack.takeResult();
}
