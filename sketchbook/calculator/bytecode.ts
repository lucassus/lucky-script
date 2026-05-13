export type Instruction =
  | { op: "push"; constantIndex: number }
  | { op: "load"; nameIndex: number }
  | { op: "storePop"; nameIndex: number }
  | { op: "dup" }
  | { op: "add" }
  | { op: "sub" }
  | { op: "neg" }
  | { op: "mul" }
  | { op: "div" };

export type Bytecode = {
  constants: number[];
  names: string[];
  instructions: Instruction[];
};
