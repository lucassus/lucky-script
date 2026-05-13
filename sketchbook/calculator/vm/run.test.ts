import { expect, test } from "vitest";

import type { Bytecode } from "../bytecode";
import { run } from "./run";
import { StackOverflow, StackUnderflow, UndefinedVariable } from "./errors";

test("run throws StackUnderflow when ADD has too few operands", () => {
  const bc: Bytecode = [{ op: "ADD" }];
  expect(() => run(bc)).toThrow(StackUnderflow);
});

test("run throws StackOverflow when stack exceeds maxStackDepth", () => {
  const bc: Bytecode = [
    { op: "PUSH", value: 1 },
    { op: "PUSH", value: 2 },
    { op: "PUSH", value: 3 },
  ];
  expect(() => run(bc, { maxStackDepth: 2 })).toThrow(StackOverflow);
});

test("run throws UndefinedVariable on LOAD of missing binding", () => {
  const bc: Bytecode = [{ op: "LOAD", name: "nope" }];
  expect(() => run(bc)).toThrow(UndefinedVariable);
});
