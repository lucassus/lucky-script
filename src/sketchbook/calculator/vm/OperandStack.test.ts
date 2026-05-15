import { expect, test } from "vitest";

import { StackOverflow, StackUnderflow } from "./errors";
import { OperandStack } from "./OperandStack";

test("OperandStack push then pop", () => {
  const s = new OperandStack(10);
  s.push(7);
  expect(s.pop()).toBe(7);
});

test("OperandStack pop throws StackUnderflow", () => {
  const s = new OperandStack(10);
  expect(() => s.pop()).toThrow(StackUnderflow);
});

test("OperandStack push throws StackOverflow at limit", () => {
  const s = new OperandStack(1);
  s.push(1);
  expect(() => s.push(2)).toThrow(StackOverflow);
});

test("OperandStack isEmpty reflects stack contents", () => {
  const s = new OperandStack(10);
  expect(s.isEmpty).toBe(true);
  s.push(42);
  expect(s.isEmpty).toBe(false);
  s.pop();
  expect(s.isEmpty).toBe(true);
});
