/** Base class for VM runtime failures thrown while executing bytecode. */
export class VmError extends Error {
  override readonly name: string = "VmError";
}

/** Too few values on the stack for an instruction (e.g. `ADD` with <2 operands). */
export class StackUnderflow extends VmError {
  override readonly name = "StackUnderflow";

  constructor(message = `stack underflow`) {
    super(message);
  }
}

/** Evaluation stack grew past the configured limit (guards pathological bytecode). */
export class StackOverflow extends VmError {
  override readonly name = "StackOverflow";

  constructor(readonly limit: number) {
    super(`stack overflow: exceeded max depth ${limit}`);
  }
}

/** Call frames grew past the configured limit (guards pathological recursion). */
export class FrameStackOverflow extends VmError {
  override readonly name = "FrameStackOverflow";

  constructor(readonly limit: number) {
    super(`frame stack overflow: exceeded max depth ${limit}`);
  }
}

/** `LOAD` or `ASSIGN` for a name not present anywhere in the Environment chain. */
export class UndefinedVariable extends VmError {
  override readonly name = "UndefinedVariable";

  constructor(readonly variableName: string) {
    super(`undefined variable '${variableName}'`);
  }
}

/** `CALL` received the wrong number of arguments for the callee's parameter list. */
export class ArityMismatch extends VmError {
  override readonly name = "ArityMismatch";

  constructor(fnName: string, expected: number, got: number) {
    super(
      `arity mismatch: ${fnName} expects ${expected} arguments, got ${got}`,
    );
  }
}

/** `CALL` was executed against a non-closure value (e.g. a number). */
export class NotCallable extends VmError {
  override readonly name = "NotCallable";

  constructor() {
    super("value is not callable");
  }
}
