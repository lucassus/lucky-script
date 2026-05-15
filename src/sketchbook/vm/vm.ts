import type { BytecodeModule, FunctionProto } from "./bytecode";
import type { Instruction } from "./opcodes";

export class StackUnderflowError extends Error {
  constructor() {
    super("micro-vm runtime: stack underflow");
    this.name = "StackUnderflowError";
  }
}

export type CallFrame = {
  fn: FunctionProto;
  ip: number;
  locals: number[];
};

export function run(module: BytecodeModule): number {
  const globalSlots = new Array<number>(module.globals.length).fill(0);
  const stack: number[] = [];
  const frames: CallFrame[] = [];

  const entryProto = module.functions[module.entry];
  if (entryProto === undefined) {
    throw new Error("micro-vm runtime: missing entry function");
  }

  frames.push({
    fn: entryProto,
    ip: 0,
    locals: new Array<number>(entryProto.localCount).fill(0),
  });

  function pop(): number {
    const v = stack.pop();
    if (v === undefined) {
      throw new StackUnderflowError();
    }
    return v;
  }

  function push(value: number): void {
    stack.push(value);
  }

  while (frames.length > 0) {
    const frame = frames[frames.length - 1]!;
    const proto = frame.fn;
    const code = proto.code;

    if (frame.ip >= code.length) {
      throw new Error(
        "micro-vm runtime: fell off end of function (missing RETURN)",
      );
    }

    const instr = code[frame.ip] as Instruction;
    frame.ip += 1;

    switch (instr.op) {
      case "CONST":
        push(module.constants[instr.index] ?? 0);
        break;
      case "LOAD_G":
        push(globalSlots[instr.slot] ?? 0);
        break;
      case "STORE_G": {
        const value = pop();
        globalSlots[instr.slot] = value;
        break;
      }
      case "LOAD_L":
        push(frame.locals[instr.slot] ?? 0);
        break;
      case "STORE_L": {
        const value = pop();
        frame.locals[instr.slot] = value;
        break;
      }
      case "ADD": {
        const b = pop();
        const a = pop();
        push(a + b);
        break;
      }
      case "SUB": {
        const b = pop();
        const a = pop();
        push(a - b);
        break;
      }
      case "MUL": {
        const b = pop();
        const a = pop();
        push(a * b);
        break;
      }
      case "DIV": {
        const b = pop();
        const a = pop();
        push(a / b);
        break;
      }
      case "LT": {
        const b = pop();
        const a = pop();
        push(a < b ? 1 : 0);
        break;
      }
      case "EQ": {
        const b = pop();
        const a = pop();
        push(a === b ? 1 : 0);
        break;
      }
      case "POP":
        pop();
        break;
      case "JUMP":
        frame.ip = instr.target;
        break;
      case "JUMP_IF_ZERO": {
        const cond = pop();
        if (cond === 0) {
          frame.ip = instr.target;
        }
        break;
      }
      case "CALL": {
        const callee = module.functions[instr.fn];
        if (callee === undefined) {
          throw new Error(`micro-vm runtime: unknown function ${instr.fn}`);
        }
        if (instr.argc !== callee.arity) {
          throw new Error(
            `micro-vm runtime: arity mismatch for ${callee.name}: expected ${callee.arity}, got ${instr.argc}`,
          );
        }
        const locals = new Array<number>(callee.localCount).fill(0);
        for (let slot = instr.argc - 1; slot >= 0; slot--) {
          locals[slot] = pop();
        }
        frames.push({
          fn: callee,
          ip: 0,
          locals,
        });
        break;
      }
      case "RETURN": {
        const value = pop();
        frames.pop();
        if (frames.length === 0) {
          return value;
        }
        push(value);
        break;
      }
      default: {
        const _exhaustive: never = instr;
        throw new Error(
          `micro-vm runtime: unknown opcode ${String(_exhaustive)}`,
        );
      }
    }
  }

  throw new Error("micro-vm runtime: execution ended without RETURN");
}
