export type Instruction =
  /** Push a number literal onto the operand stack. */
  | { op: "PUSH"; value: number }
  /** Duplicate the top value on the stack. */
  | { op: "DUP" }
  /** Look up a variable by name and push its value; undefined names are a runtime error. */
  | { op: "LOAD"; name: string }
  /** Pop the top value and store it under `name` in the runtime binding map. */
  | { op: "STORE"; name: string }
  /** Pop the top value and discard it (e.g. for expression statements). */
  | { op: "POP" }
  /** Pop `right`, then `left`, push `left + right`. */
  | { op: "ADD" }
  /** Pop `right`, then `left`, push `left - right`. */
  | { op: "SUB" }
  /** Pop `right`, then `left`, push `left * right`. */
  | { op: "MUL" }
  /** Pop `right`, then `left`, push `left / right`. */
  | { op: "DIV" }
  /** Pop one value and push its arithmetic negation. */
  | { op: "NEG" }
  /** Pop `right`, then `left`, push 1 if `left > right`, else 0. */
  | { op: "GT" }
  /** Pop `right`, then `left`, push 1 if `left < right`, else 0. */
  | { op: "LT" }
  /** Pop `right`, then `left`, push 1 if `left >= right`, else 0. */
  | { op: "GTE" }
  /** Pop `right`, then `left`, push 1 if `left <= right`, else 0. */
  | { op: "LTE" }
  /** Pop `right`, then `left`, push 1 if `left === right`, else 0. */
  | { op: "EQ" }
  /** Pop `right`, then `left`, push 1 if `left !== right`, else 0. */
  | { op: "NEQ" }
  /** Pop `right`, then `left`, push 1 if both are non-zero, else 0. */
  | { op: "AND" }
  /** Pop `right`, then `left`, push 1 if either is non-zero, else 0. */
  | { op: "OR" }
  /** Pop one value, push 1 if it is zero, else 0. */
  | { op: "NOT" };

export type Bytecode = Instruction[];
