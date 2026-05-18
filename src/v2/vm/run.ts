import type { Bytecode, FunctionProto } from "../compiler";
import { Environment } from "./Environment";
import {
  ArityMismatch,
  FrameStackOverflow,
  NotCallable,
  VmError,
} from "./errors";
import { OperandStack } from "./OperandStack";
import type { Value } from "./value";

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
  // Each frame owns one Environment; its enclosing is the callee's captured env.
  readonly env: Environment;
}

/** Unwrap a NumberValue or throw a descriptive error for the given opcode. */
function asNum(v: Value, opcode: string): number {
  if (v.kind === "number") return v.value;
  throw new VmError(`${opcode}: operand must be a number, got closure`);
}

/** Wrap a raw number in a NumberValue. */
function num(value: number): Value {
  return { kind: "number", value };
}

export function run(
  bytecode: Bytecode,
  options?: RunOptions,
): Value | undefined {
  const stack = new OperandStack<Value>(
    options?.maxStackDepth ?? DEFAULT_MAX_STACK_DEPTH,
  );
  const maxFrameDepth = options?.maxFrameDepth ?? DEFAULT_MAX_FRAME_DEPTH;

  const frames: CallFrame[] = [
    {
      proto: bytecode.main,
      ip: 0,
      // The global environment is shared by all top-level closures via reference.
      // DEFINE "f" in main mutates this object, so closures created by MAKE_CLOSURE
      // before that DEFINE will still see "f" when they execute later.
      env: new Environment(null),
    },
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
        stack.push(num(instruction.value));
        break;
      }

      case "DUP": {
        const top = stack.pop();
        stack.push(top);
        stack.push(top);
        break;
      }

      case "LOAD": {
        // get() walks the Environment chain and throws UndefinedVariable if absent.
        stack.push(frame.env.get(instruction.name));
        break;
      }

      case "DEFINE": {
        // Compiled from `let x = e`. Writes to the current frame's Environment only.
        frame.env.define(instruction.name, stack.pop());
        break;
      }

      case "ASSIGN": {
        // Compiled from bare `x = e`. Walks the chain; throws if name not found.
        frame.env.assign(instruction.name, stack.pop());
        break;
      }

      case "POP": {
        stack.pop();
        break;
      }

      case "ADD": {
        const right = asNum(stack.pop(), "ADD");
        const left = asNum(stack.pop(), "ADD");
        stack.push(num(left + right));
        break;
      }

      case "SUB": {
        const right = asNum(stack.pop(), "SUB");
        const left = asNum(stack.pop(), "SUB");
        stack.push(num(left - right));
        break;
      }

      case "MUL": {
        const right = asNum(stack.pop(), "MUL");
        const left = asNum(stack.pop(), "MUL");
        stack.push(num(left * right));
        break;
      }

      case "DIV": {
        const right = asNum(stack.pop(), "DIV");
        const left = asNum(stack.pop(), "DIV");
        stack.push(num(left / right));
        break;
      }

      case "NEG": {
        stack.push(num(-asNum(stack.pop(), "NEG")));
        break;
      }

      case "GT": {
        const right = asNum(stack.pop(), "GT");
        const left = asNum(stack.pop(), "GT");
        stack.push(num(left > right ? 1 : 0));
        break;
      }

      case "LT": {
        const right = asNum(stack.pop(), "LT");
        const left = asNum(stack.pop(), "LT");
        stack.push(num(left < right ? 1 : 0));
        break;
      }

      case "GTE": {
        const right = asNum(stack.pop(), "GTE");
        const left = asNum(stack.pop(), "GTE");
        stack.push(num(left >= right ? 1 : 0));
        break;
      }

      case "LTE": {
        const right = asNum(stack.pop(), "LTE");
        const left = asNum(stack.pop(), "LTE");
        stack.push(num(left <= right ? 1 : 0));
        break;
      }

      case "EQ": {
        const right = stack.pop();
        const left = stack.pop();
        // Closure === Closure is always false (distinct objects).
        const eq =
          left.kind === "number" && right.kind === "number"
            ? left.value === right.value
            : left === right;
        stack.push(num(eq ? 1 : 0));
        break;
      }

      case "NEQ": {
        const right = stack.pop();
        const left = stack.pop();
        const eq =
          left.kind === "number" && right.kind === "number"
            ? left.value === right.value
            : left === right;
        stack.push(num(eq ? 0 : 1));
        break;
      }

      case "NOT": {
        stack.push(num(asNum(stack.pop(), "NOT") === 0 ? 1 : 0));
        break;
      }

      case "JMP": {
        frame.ip = instruction.target;
        break;
      }

      case "JMP_IF_ZERO": {
        if (asNum(stack.pop(), "JMP_IF_ZERO") === 0) {
          frame.ip = instruction.target;
        }
        break;
      }

      case "MAKE_CLOSURE": {
        const proto = bytecode.functions[instruction.fnIndex];
        if (!proto) {
          throw new Error(`Invalid function index: ${instruction.fnIndex}`);
        }

        // Capture the current frame's Environment by reference. Any subsequent
        // DEFINE in this env (e.g. binding the function's own name for
        // self-recursion) will be visible to the closure when it executes.
        stack.push({ kind: "closure", proto, env: frame.env });
        break;
      }

      case "CALL": {
        if (frames.length >= maxFrameDepth) {
          throw new FrameStackOverflow(maxFrameDepth);
        }

        // Arguments were pushed left-to-right; collect them in reverse order.
        const argc = instruction.argc;
        const args: Value[] = [];
        for (let i = 0; i < argc; i++) {
          args.unshift(stack.pop());
        }

        // Callee sits below the arguments on the stack.
        const callee = stack.pop();
        if (callee.kind !== "closure") {
          throw new NotCallable();
        }

        if (args.length !== callee.proto.params.length) {
          throw new ArityMismatch(
            callee.proto.name,
            callee.proto.params.length,
            args.length,
          );
        }

        // New frame's Environment is a child of the closure's captured env,
        // not the caller's env. This is what makes closures work.
        const callEnv = new Environment(callee.env);
        for (let i = 0; i < argc; i++) {
          callEnv.define(callee.proto.params[i]!, args[i]!);
        }

        frames.push({ proto: callee.proto, ip: 0, env: callEnv });
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
