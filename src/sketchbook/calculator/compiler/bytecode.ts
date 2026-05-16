export type Instruction =
  /** Push a number literal onto the operand stack. */
  | { opcode: "PUSH"; value: number }
  /** Duplicate the top value on the stack. */
  | { opcode: "DUP" }
  /**
   * Push the value of the named binding from the **current** frame's locals map.
   * The compiler guarantees the name is bound before any read.
   */
  | { opcode: "LOAD"; name: string }
  /**
   * Pop one value and store it under `name` in the current frame's locals map
   * (creates the binding if not present).
   */
  | { opcode: "STORE"; name: string }
  /** Pop the top value and discard it (e.g. for expression statements). */
  | { opcode: "POP" }
  /** Pop `right`, then `left`, push `left + right`. */
  | { opcode: "ADD" }
  /** Pop `right`, then `left`, push `left - right`. */
  | { opcode: "SUB" }
  /** Pop `right`, then `left`, push `left * right`. */
  | { opcode: "MUL" }
  /** Pop `right`, then `left`, push `left / right`. */
  | { opcode: "DIV" }
  /** Pop one value and push its arithmetic negation. */
  | { opcode: "NEG" }
  /** Pop `right`, then `left`, push 1 if `left > right`, else 0. */
  | { opcode: "GT" }
  /** Pop `right`, then `left`, push 1 if `left < right`, else 0. */
  | { opcode: "LT" }
  /** Pop `right`, then `left`, push 1 if `left >= right`, else 0. */
  | { opcode: "GTE" }
  /** Pop `right`, then `left`, push 1 if `left <= right`, else 0. */
  | { opcode: "LTE" }
  /** Pop `right`, then `left`, push 1 if `left === right`, else 0. */
  | { opcode: "EQ" }
  /** Pop `right`, then `left`, push 1 if `left !== right`, else 0. */
  | { opcode: "NEQ" }
  /** Pop one value, push 1 if it is zero, else 0. */
  | { opcode: "NOT" }
  /**
   * Pop the top value; if it is zero, set the instruction pointer to `target`
   * (absolute index of the next instruction to run).
   */
  | { opcode: "JMP_IF_ZERO"; target: number }
  /** Unconditionally set the instruction pointer to `target`. */
  | { opcode: "JMP"; target: number }
  /**
   * Pop `argc` argument values, allocate a new frame for `module.functions[fnIndex]`,
   * bind each parameter name to its corresponding argument (declaration order), and transfer control.
   * Operand-stack net effect after the callee runs `RETURN`: `-argc + 1` (arguments consumed, one return value pushed).
   */
  | { opcode: "CALL"; fnIndex: number; argc: number }
  /**
   * Pop one return value from the operand stack, pop the current frame, and push that value
   * onto the caller's operand stack.
   */
  | { opcode: "RETURN" }
  /**
   * Terminate the program and yield the top of the operand stack as the
   * program's result. If the stack is empty, the result is `undefined`.
   * Valid only while executing in the main (`__main`) frame.
   */
  | { opcode: "HALT" };

/** Bytecode for a single function body (`__main` or a user `def`). */
export type Bytecode = Instruction[];

export interface FunctionProto {
  readonly name: string;
  readonly params: readonly string[];
  readonly code: Instruction[];
}

/**
 * A compiled calculator module: top-level script (`main`) plus indexed user functions (`functions`).
 * `CALL.fnIndex` indexes into `functions` only — `main` is never invoked via `CALL`.
 */
export interface BytecodeModule {
  readonly main: FunctionProto;
  readonly functions: readonly FunctionProto[];
}
