import { describe, expect, test } from "vitest";

import {
  appendFunctionProto,
  createBytecodeModule,
  createFunctionProto,
  pushConstant,
} from "./bytecode";
import type { Instruction } from "./opcodes";
import { run, StackUnderflowError } from "./vm";

function addMain(
  module: ReturnType<typeof createBytecodeModule>,
  code: Instruction[],
): void {
  const main = createFunctionProto("__main", 0);
  main.localCount = 0;
  main.code = code;
  appendFunctionProto(module, main);
}

describe("vm", () => {
  test("hand-written __main evaluates 1 + 2", () => {
    const module = createBytecodeModule();
    const i0 = pushConstant(module, 1);
    const i1 = pushConstant(module, 2);
    addMain(module, [
      { op: "CONST", index: i0 },
      { op: "CONST", index: i1 },
      { op: "ADD" },
      { op: "RETURN" },
    ]);
    expect(run(module)).toBe(3);
  });

  test("SUB", () => {
    const module = createBytecodeModule();
    addMain(module, [
      { op: "CONST", index: pushConstant(module, 5) },
      { op: "CONST", index: pushConstant(module, 2) },
      { op: "SUB" },
      { op: "RETURN" },
    ]);
    expect(run(module)).toBe(3);
  });

  test("MUL", () => {
    const module = createBytecodeModule();
    addMain(module, [
      { op: "CONST", index: pushConstant(module, 3) },
      { op: "CONST", index: pushConstant(module, 4) },
      { op: "MUL" },
      { op: "RETURN" },
    ]);
    expect(run(module)).toBe(12);
  });

  test("DIV", () => {
    const module = createBytecodeModule();
    addMain(module, [
      { op: "CONST", index: pushConstant(module, 10) },
      { op: "CONST", index: pushConstant(module, 2) },
      { op: "DIV" },
      { op: "RETURN" },
    ]);
    expect(run(module)).toBe(5);
  });

  test("LT pushes 1 or 0", () => {
    const module = createBytecodeModule();
    addMain(module, [
      { op: "CONST", index: pushConstant(module, 2) },
      { op: "CONST", index: pushConstant(module, 5) },
      { op: "LT" },
      { op: "RETURN" },
    ]);
    expect(run(module)).toBe(1);
  });

  test("EQ pushes 1 or 0", () => {
    const module = createBytecodeModule();
    addMain(module, [
      { op: "CONST", index: pushConstant(module, 5) },
      { op: "CONST", index: pushConstant(module, 5) },
      { op: "EQ" },
      { op: "RETURN" },
    ]);
    expect(run(module)).toBe(1);
  });

  test("POP drops TOS", () => {
    const module = createBytecodeModule();
    addMain(module, [
      { op: "CONST", index: pushConstant(module, 0) },
      { op: "CONST", index: pushConstant(module, 42) },
      { op: "POP" },
      { op: "RETURN" },
    ]);
    expect(run(module)).toBe(0);
  });

  test("globals LOAD_G / STORE_G", () => {
    const module = createBytecodeModule();
    module.globals.push("g");
    addMain(module, [
      { op: "CONST", index: pushConstant(module, 42) },
      { op: "STORE_G", slot: 0 },
      { op: "LOAD_G", slot: 0 },
      { op: "RETURN" },
    ]);
    expect(run(module)).toBe(42);
  });

  test("locals LOAD_L / STORE_L", () => {
    const module = createBytecodeModule();
    const main = createFunctionProto("__main", 0);
    main.localCount = 1;
    main.localNames = ["slot0"];
    main.code = [
      { op: "CONST", index: pushConstant(module, 7) },
      { op: "STORE_L", slot: 0 },
      { op: "LOAD_L", slot: 0 },
      { op: "RETURN" },
    ];
    appendFunctionProto(module, main);
    expect(run(module)).toBe(7);
  });

  test("CALL binds argc into locals and RETURN resumes caller", () => {
    const module = createBytecodeModule();
    const callee = createFunctionProto("id", 1);
    callee.localCount = 1;
    callee.localNames = ["a"];
    callee.code = [{ op: "LOAD_L", slot: 0 }, { op: "RETURN" }];

    const main = createFunctionProto("__main", 0);
    main.localCount = 0;
    main.code = [
      { op: "CONST", index: pushConstant(module, 99) },
      { op: "CALL", fn: 1, argc: 1 },
      { op: "RETURN" },
    ];

    appendFunctionProto(module, main);
    appendFunctionProto(module, callee);

    expect(run(module)).toBe(99);
  });

  test("hand-written recursive countdown reaches zero", () => {
    const module = createBytecodeModule();
    const zero = pushConstant(module, 0);
    const one = pushConstant(module, 1);

    const countdown = createFunctionProto("countdown", 1);
    countdown.localCount = 1;
    countdown.localNames = ["n"];
    const fnIdx = 1;
    countdown.code = [
      { op: "LOAD_L", slot: 0 },
      { op: "JUMP_IF_ZERO", target: 7 },
      { op: "LOAD_L", slot: 0 },
      { op: "CONST", index: one },
      { op: "SUB" },
      { op: "CALL", fn: fnIdx, argc: 1 },
      { op: "RETURN" },
      { op: "CONST", index: zero },
      { op: "RETURN" },
    ];

    const main = createFunctionProto("__main", 0);
    main.localCount = 0;
    main.code = [
      { op: "CONST", index: pushConstant(module, 3) },
      { op: "CALL", fn: fnIdx, argc: 1 },
      { op: "RETURN" },
    ];

    appendFunctionProto(module, main);
    appendFunctionProto(module, countdown);

    expect(run(module)).toBe(0);
  });

  test("JUMP_IF_ZERO skips straight-line value when condition non-zero", () => {
    const module = createBytecodeModule();
    addMain(module, [
      { op: "CONST", index: pushConstant(module, 1) },
      { op: "JUMP_IF_ZERO", target: 4 },
      { op: "CONST", index: pushConstant(module, 5) },
      { op: "RETURN" },
      { op: "CONST", index: pushConstant(module, 42) },
      { op: "RETURN" },
    ]);
    expect(run(module)).toBe(5);
  });

  test("JUMP_IF_ZERO jumps when condition is zero", () => {
    const module = createBytecodeModule();
    addMain(module, [
      { op: "CONST", index: pushConstant(module, 0) },
      { op: "JUMP_IF_ZERO", target: 4 },
      { op: "CONST", index: pushConstant(module, 5) },
      { op: "RETURN" },
      { op: "CONST", index: pushConstant(module, 42) },
      { op: "RETURN" },
    ]);
    expect(run(module)).toBe(42);
  });

  test("RETURN with empty stack throws StackUnderflowError", () => {
    const module = createBytecodeModule();
    addMain(module, [{ op: "RETURN" }]);
    expect(() => run(module)).toThrow(StackUnderflowError);
  });
});
