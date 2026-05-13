import type { Bytecode } from "./compiler";

export function run(bytecode: Bytecode): number {
  const stack: number[] = [];

  bytecode.instructions.forEach((instruction) => {
    if (instruction.op == "push") {
      const value = bytecode.constants[instruction.constantIndex]!;
      stack.push(value);
    }

    if (instruction.op == "add") {
      const right = stack.pop()!;
      const left = stack.pop()!;
      stack.push(left + right);
    }

    if (instruction.op == "sub") {
      const right = stack.pop()!;
      const left = stack.pop()!;
      stack.push(left - right);
    }

    if (instruction.op == "mul") {
      const right = stack.pop()!;
      const left = stack.pop()!;
      stack.push(left * right);
    }

    if (instruction.op == "div") {
      const right = stack.pop()!;
      const left = stack.pop()!;
      stack.push(left / right);
    }

    if (instruction.op == "neg") {
      const value = stack.pop()!;
      stack.push(-value);
    }
  });

  return stack.pop()!;
}
