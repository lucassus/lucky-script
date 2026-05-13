import { expect, test } from "vitest";

import { OperandStack } from "./OperandStack";
import { StackOverflow, StackUnderflow } from "./errors";

test("OperandStack push then pop", () => {
  const s = new OperandStack(10);
  s.push(7);
  expect(s.pop("TEST")).toBe(7);
});

test("OperandStack pop throws StackUnderflow", () => {
  const s = new OperandStack(10);
  expect(() => s.pop("TEST")).toThrow(StackUnderflow);
});

test("OperandStack push throws StackOverflow at limit", () => {
  const s = new OperandStack(1);
  s.push(1);
  expect(() => s.push(2)).toThrow(StackOverflow);
});

test("OperandStack takeResult returns undefined when empty", () => {
  const s = new OperandStack(10);
  expect(s.takeResult()).toBeUndefined();
});

test("OperandStack takeResult pops one value", () => {
  const s = new OperandStack(10);
  s.push(42);
  expect(s.takeResult()).toBe(42);
});
