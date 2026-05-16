import type { FunctionProto } from "../compiler/bytecode";
import type { Environment } from "./Environment";

export interface NumberValue {
  readonly kind: "number";
  readonly value: number;
}

export interface ClosureValue {
  readonly kind: "closure";
  readonly proto: FunctionProto;
  // The lexical environment captured when the def statement executed.
  readonly env: Environment;
}

export type Value = NumberValue | ClosureValue;
