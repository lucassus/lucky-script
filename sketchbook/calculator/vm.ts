import type { Bytecode } from "./bytecode";

export function run(bytecode: Bytecode): number {
  const stack: number[] = [];
  const env = new Map<string, number>();

  let ip = 0;

  while (ip < bytecode.instructions.length) {
    const instr = bytecode.instructions[ip]!;
    ip += 1;

    switch (instr.op) {
      case "push": {
        const value = bytecode.constants[instr.constantIndex]!;
        stack.push(value);
        break;
      }

      case "load": {
        const key = bytecode.names[instr.nameIndex]!;
        const value = env.get(key);
        if (value === undefined) {
          throw new Error(`Undefined variable '${key}'`);
        }
        stack.push(value);
        break;
      }

      case "storePop": {
        const key = bytecode.names[instr.nameIndex]!;
        const popped = stack.pop();
        if (popped === undefined) {
          throw new Error("Stack underflow");
        }
        env.set(key, popped);
        break;
      }

      case "dup": {
        const top = stack[stack.length - 1];
        if (top === undefined) {
          throw new Error("Stack underflow");
        }
        stack.push(top);
        break;
      }

      case "add": {
        const right = stack.pop()!;
        const left = stack.pop()!;
        stack.push(left + right);
        break;
      }

      case "sub": {
        const right = stack.pop()!;
        const left = stack.pop()!;
        stack.push(left - right);
        break;
      }

      case "mul": {
        const right = stack.pop()!;
        const left = stack.pop()!;
        stack.push(left * right);
        break;
      }

      case "div": {
        const right = stack.pop()!;
        const left = stack.pop()!;
        stack.push(left / right);
        break;
      }

      case "neg": {
        const value = stack.pop()!;
        stack.push(-value);
        break;
      }

      default: {
        instr satisfies never;
      }
    }
  }

  return stack.pop()!;
}
