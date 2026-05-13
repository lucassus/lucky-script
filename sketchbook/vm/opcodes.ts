export type Instruction =
  | { op: "CONST"; index: number }
  | { op: "LOAD_G"; slot: number }
  | { op: "STORE_G"; slot: number }
  | { op: "LOAD_L"; slot: number }
  | { op: "STORE_L"; slot: number }
  | { op: "ADD" }
  | { op: "SUB" }
  | { op: "MUL" }
  | { op: "DIV" }
  | { op: "LT" }
  | { op: "EQ" }
  | { op: "JUMP"; target: number }
  | { op: "JUMP_IF_ZERO"; target: number }
  | { op: "CALL"; fn: number; argc: number }
  | { op: "RETURN" }
  | { op: "POP" };
