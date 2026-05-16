import type { BytecodeModule, FunctionProto } from "../compiler";
import { FrameStackOverflow, UndefinedVariable, VmError } from "./errors";
import { OperandStack } from "./OperandStack";

const DEFAULT_MAX_STACK_DEPTH = 10_000;
const DEFAULT_MAX_FRAME_DEPTH = 1024;

export type RunOptions = {
  /** Max operand-stack slots; default {@link DEFAULT_MAX_STACK_DEPTH}. */
  maxStackDepth?: number;
  /** Max call frames (including `__main`); default {@link DEFAULT_MAX_FRAME_DEPTH}. */
  maxFrameDepth?: number;
};

interface CallFrame {
  readonly proto: FunctionProto;
  ip: number;
  readonly locals: Map<string, number>;
}

export function run(
  module: BytecodeModule,
  options?: RunOptions,
): number | undefined {
  const stack = new OperandStack(
    options?.maxStackDepth ?? DEFAULT_MAX_STACK_DEPTH,
  );
  const maxFrameDepth = options?.maxFrameDepth ?? DEFAULT_MAX_FRAME_DEPTH;

  const frames: CallFrame[] = [
    { proto: module.main, ip: 0, locals: new Map() },
  ];

  while (frames.length > 0) {
    const frame = frames[frames.length - 1]!;
    const code = frame.proto.code;

    if (frame.ip < 0 || frame.ip >= code.length) {
      throw new Error(`Invalid instruction pointer: ${frame.ip}`);
    }

    const instruction = code[frame.ip]!;
    frame.ip++;

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
        const value = frame.locals.get(instruction.name);
        if (value === undefined) {
          throw new UndefinedVariable(instruction.name);
        }
        stack.push(value);
        break;
      }

      case "STORE": {
        const popped = stack.pop();
        frame.locals.set(instruction.name, popped);
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
        frame.ip = instruction.target;
        break;
      }

      case "JMP_IF_ZERO": {
        const value = stack.pop();
        if (value === 0) {
          frame.ip = instruction.target;
        }
        break;
      }

      case "CALL": {
        if (frames.length >= maxFrameDepth) {
          throw new FrameStackOverflow(maxFrameDepth);
        }

        const callee = module.functions[instruction.fnIndex];
        if (!callee) {
          throw new Error(`Invalid function index: ${instruction.fnIndex}`);
        }

        const argc = instruction.argc;
        const reversedArgs: number[] = [];
        for (let i = 0; i < argc; i++) {
          reversedArgs.push(stack.pop());
        }
        const args = reversedArgs.reverse();

        const locals = new Map<string, number>();
        for (let i = 0; i < argc; i++) {
          locals.set(callee.params[i]!, args[i]!);
        }

        frames.push({ proto: callee, ip: 0, locals });
        break;
      }

      case "RETURN": {
        const returnValue = stack.pop();
        frames.pop();

        if (frames.length === 0) {
          return returnValue;
        }

        stack.push(returnValue);
        break;
      }

      case "HALT": {
        const isMainFrame =
          frames.length === 1 && frame.proto.name === "__main";
        if (!isMainFrame) {
          throw new VmError("HALT outside of main frame");
        }

        return stack.isEmpty ? undefined : stack.pop();
      }

      default: {
        instruction satisfies never;
      }
    }
  }

  return undefined;
}
