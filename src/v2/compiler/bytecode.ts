// ── Instructions ─────────────────────────────────────────────────────────────

export type Instruction =
  /** Push a number literal onto the operand stack. */
  | { opcode: "PUSH"; value: number }
  /** Duplicate the top value on the stack. */
  | { opcode: "DUP" }
  /** Walk the Environment chain from the current frame and push the value. */
  | { opcode: "LOAD"; name: string }
  /**
   * Pop one value and create a new binding in the CURRENT frame's Environment.
   * Compiled from `let x = e`. Never walks the chain.
   */
  | { opcode: "DEFINE"; name: string }
  /**
   * Pop one value and walk the Environment chain to find and update an existing
   * binding. Compiled from bare `x = e`. Throws UndefinedVariable if the name
   * is not found anywhere in the chain.
   */
  | { opcode: "ASSIGN"; name: string }
  /** Pop the top value and discard it (expression statements). */
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
   * Pop the top value; if it is zero, set the instruction pointer to `target`.
   */
  | { opcode: "JMP_IF_ZERO"; target: number }
  /** Unconditionally set the instruction pointer to `target`. */
  | { opcode: "JMP"; target: number }
  /**
   * Create a ClosureValue from `module.functions[fnIndex]` and the current
   * frame's Environment, then push it. The enclosing Environment is captured
   * by reference, so mutations via ASSIGN are visible to the closure.
   */
  | { opcode: "MAKE_CLOSURE"; fnIndex: number }
  /**
   * Pop the callee (must be a ClosureValue), pop `argc` argument values, create
   * a new Environment with `enclosing = callee.env`, bind each parameter, and
   * transfer control. The callee sits below the arguments on the stack.
   */
  | { opcode: "CALL"; argc: number }
  /**
   * Pop one return value, pop the current frame, and push the value onto the
   * caller's operand stack.
   */
  | { opcode: "RETURN" }
  /**
   * Terminate the program. Returns the top of the stack (or undefined if empty).
   * Valid only in the main (`__main`) frame.
   */
  | { opcode: "HALT" };

export type Bytecode = Instruction[];

export interface FunctionProto {
  readonly name: string;
  readonly params: readonly string[];
  readonly code: Instruction[];
}

/**
 * A compiled module: top-level script (`main`) plus all named function bodies
 * (`functions`). `MAKE_CLOSURE` references `functions` by index; `main` is
 * never referenced by index.
 */
export interface BytecodeModule {
  readonly main: FunctionProto;
  readonly functions: readonly FunctionProto[];
}
