export type Instruction =
  /** Push a number literal onto the operand stack. */
  | { opcode: "PUSH"; value: number }
  /** Duplicate the top value on the stack. */
  | { opcode: "DUP" }
  /** Look up a variable by name and push its value; undefined names are a runtime error. */
  | { opcode: "LOAD"; name: string }
  /** Pop the top value and store it under `name` in the runtime binding map. */
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
  /** Pop `right`, then `left`, push 1 if both are non-zero, else 0. */
  | { opcode: "AND" }
  /** Pop `right`, then `left`, push 1 if either is non-zero, else 0. */
  | { opcode: "OR" }
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
   * Terminate the program and yield the top of the operand stack as the
   * program's result. If the stack is empty, the result is `undefined`.
   */
  | { opcode: "HALT" };

export type Bytecode = Instruction[];
