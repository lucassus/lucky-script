import type { Bytecode, Instruction } from "../compiler";
import { UndefinedVariable } from "./errors";
import { OperandStack } from "./OperandStack";

const DEFAULT_MAX_STACK_DEPTH = 10_000;

export type RunOptions = {
  /** Max stack slots; default {@link DEFAULT_MAX_STACK_DEPTH}. */
  maxStackDepth?: number;
};

function fetch(
  code: Bytecode,
  ip: number,
): { instruction: Instruction; nextIp: number } {
  if (ip < 0 || ip >= code.length) {
    throw new Error(`Invalid instruction pointer: ${ip}`);
  }

  return { instruction: code[ip]!, nextIp: ip + 1 };
}

export function run(code: Bytecode, options?: RunOptions): number | undefined {
  const stack = new OperandStack(
    options?.maxStackDepth ?? DEFAULT_MAX_STACK_DEPTH,
  );
  const bindings = new Map<string, number>();

  let ip = 0;

  while (ip < code.length) {
    const { instruction, nextIp } = fetch(code, ip);
    ip = nextIp;

    switch (instruction.opcode) {
      case "PUSH": {
        stack.push(instruction.value);
        break;
      }

      case "DUP": {
        const top = stack.pop();
        stack.push(top);
        stack.push(top);
        break;
      }

      case "LOAD": {
        const value = bindings.get(instruction.name);
        if (value === undefined) {
          throw new UndefinedVariable(instruction.name);
        }
        stack.push(value);
        break;
      }

      case "STORE": {
        const popped = stack.pop();
        bindings.set(instruction.name, popped);
        break;
      }

      case "POP": {
        stack.pop();
        break;
      }

      case "ADD": {
        const right = stack.pop();
        const left = stack.pop();
        stack.push(left + right);
        break;
      }

      case "SUB": {
        const right = stack.pop();
        const left = stack.pop();
        stack.push(left - right);
        break;
      }

      case "MUL": {
        const right = stack.pop();
        const left = stack.pop();
        stack.push(left * right);
        break;
      }

      case "DIV": {
        const right = stack.pop();
        const left = stack.pop();
        stack.push(left / right);
        break;
      }

      case "NEG": {
        const value = stack.pop();
        stack.push(-value);
        break;
      }

      case "GT": {
        const right = stack.pop();
        const left = stack.pop();
        stack.push(left > right ? 1 : 0);
        break;
      }

      case "LT": {
        const right = stack.pop();
        const left = stack.pop();
        stack.push(left < right ? 1 : 0);
        break;
      }

      case "GTE": {
        const right = stack.pop();
        const left = stack.pop();
        stack.push(left >= right ? 1 : 0);
        break;
      }

      case "LTE": {
        const right = stack.pop();
        const left = stack.pop();
        stack.push(left <= right ? 1 : 0);
        break;
      }

      case "EQ": {
        const right = stack.pop();
        const left = stack.pop();
        stack.push(left === right ? 1 : 0);
        break;
      }

      case "NEQ": {
        const right = stack.pop();
        const left = stack.pop();
        stack.push(left !== right ? 1 : 0);
        break;
      }

      case "NOT": {
        const value = stack.pop();
        stack.push(value === 0 ? 1 : 0);
        break;
      }

      case "JMP": {
        ip = instruction.target;
        break;
      }

      case "JMP_IF_ZERO": {
        const value = stack.pop();
        if (value === 0) {
          ip = instruction.target;
        }
        break;
      }

      case "HALT": {
        return stack.isEmpty ? undefined : stack.pop();
      }

      default: {
        instruction satisfies never;
      }
    }
  }

  return undefined;
}
