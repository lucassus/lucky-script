import { expect, test } from "vitest";

import type { Bytecode } from "../compiler/bytecode";
import { StackOverflow, StackUnderflow, UndefinedVariable } from "./errors";
import { run } from "./run";

test("run throws StackUnderflow when ADD has too few operands", () => {
  const bc: Bytecode = [{ opcode: "ADD" }];
  expect(() => run(bc)).toThrow(StackUnderflow);
});

test("run throws StackOverflow when stack exceeds maxStackDepth", () => {
  const bc: Bytecode = [
    { opcode: "PUSH", value: 1 },
    { opcode: "PUSH", value: 2 },
    { opcode: "PUSH", value: 3 },
  ];
  expect(() => run(bc, { maxStackDepth: 2 })).toThrow(StackOverflow);
});

test("run throws UndefinedVariable on LOAD of missing binding", () => {
  const bc: Bytecode = [{ opcode: "LOAD", name: "nope" }];
  expect(() => run(bc)).toThrow(UndefinedVariable);
});
