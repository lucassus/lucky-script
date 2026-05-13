import type { Instruction } from "./opcodes";

export type FunctionProto = {
  name: string;
  arity: number;
  localCount: number;
  localNames: string[];
  code: Instruction[];
};

export type BytecodeModule = {
  constants: number[];
  globals: string[];
  functions: FunctionProto[];
  /** Synthetic `__main` lives at index `0`. */
  entry: number;
};

export function createBytecodeModule(): BytecodeModule {
  return {
    constants: [],
    globals: [],
    functions: [],
    entry: 0,
  };
}

export function pushConstant(module: BytecodeModule, value: number): number {
  const index = module.constants.length;
  module.constants.push(value);
  return index;
}

export function allocateGlobalSlot(
  module: BytecodeModule,
  name: string,
): number {
  const slot = module.globals.length;
  module.globals.push(name);
  return slot;
}

export function appendFunctionProto(
  module: BytecodeModule,
  proto: FunctionProto,
): number {
  const index = module.functions.length;
  module.functions.push(proto);
  return index;
}

export function createFunctionProto(
  name: string,
  arity: number,
): FunctionProto {
  return {
    name,
    arity,
    localCount: arity,
    localNames: [],
    code: [],
  };
}
