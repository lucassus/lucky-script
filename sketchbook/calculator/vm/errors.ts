/** Base class for VM runtime failures thrown while executing bytecode. */
export class VmError extends Error {
  override readonly name = "VmError";
}

/** Too few values on the stack for an instruction (e.g. `ADD` with <2 operands). */
export class StackUnderflow extends VmError {
  override readonly name = "StackUnderflow";

  constructor(
    readonly op: string,
    message = `stack underflow while executing ${op}`,
  ) {
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

/** `LOAD` for a name not present in bindings (should be rare if bytecode comes from the compiler). */
export class UndefinedVariable extends VmError {
  override readonly name = "UndefinedVariable";

  constructor(readonly variableName: string) {
    super(`undefined variable '${variableName}'`);
  }
}
