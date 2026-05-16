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

/** `LOAD` for a name not present in the current frame's locals (should be rare if bytecode comes from the compiler). */
export class UndefinedVariable extends VmError {
  override readonly name = "UndefinedVariable";

  constructor(readonly variableName: string) {
    super(`undefined variable '${variableName}'`);
  }
}
