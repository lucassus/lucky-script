import { expect, test } from "vitest";

import { StackOverflow, StackUnderflow } from "./errors";
import { OperandStack } from "./OperandStack";
import type { Value } from "./value";

const num = (value: number): Value => ({ kind: "number", value });

test("OperandStack push then pop", () => {
  const s = new OperandStack(10);
  s.push(num(7));
  expect(s.pop()).toEqual(num(7));
});

test("OperandStack pop throws StackUnderflow", () => {
  const s = new OperandStack(10);
  expect(() => s.pop()).toThrow(StackUnderflow);
});

test("OperandStack push throws StackOverflow at limit", () => {
  const s = new OperandStack(1);
  s.push(num(1));
  expect(() => s.push(num(2))).toThrow(StackOverflow);
});

test("OperandStack isEmpty reflects stack contents", () => {
  const s = new OperandStack(10);
  expect(s.isEmpty).toBe(true);
  s.push(num(42));
  expect(s.isEmpty).toBe(false);
  s.pop();
  expect(s.isEmpty).toBe(true);
});
