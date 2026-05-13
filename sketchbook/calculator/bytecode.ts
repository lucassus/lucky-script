export type Instruction =
  | { op: "PUSH"; value: number }
  | { op: "LOAD"; name: string }
  | { op: "STORE"; name: string }
  | { op: "POP" }
  | { op: "ADD" }
  | { op: "SUB" }
  | { op: "MUL" }
  | { op: "DIV" }
  | { op: "NEG" };

/** Flat, self-contained instruction stream. */
export type Bytecode = Instruction[];
