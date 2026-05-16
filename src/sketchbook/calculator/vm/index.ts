export { Environment } from "./Environment";
export {
  ArityMismatch,
  FrameStackOverflow,
  NotCallable,
  StackOverflow,
  StackUnderflow,
  UndefinedVariable,
  VmError,
} from "./errors";
export { OperandStack } from "./OperandStack";
export { run, type RunOptions } from "./run";
export type { ClosureValue, NumberValue, Value } from "./value";
