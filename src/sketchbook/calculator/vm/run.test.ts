import { expect, test } from "vitest";

import type { BytecodeModule } from "../compiler/bytecode";
import {
  FrameStackOverflow,
  StackOverflow,
  StackUnderflow,
  UndefinedVariable,
} from "./errors";
import { run } from "./run";

function mainModule(code: BytecodeModule["main"]["code"]): BytecodeModule {
  return { main: { name: "__main", params: [], code }, functions: [] };
}

test("run throws StackUnderflow when ADD has too few operands", () => {
  const mod = mainModule([{ opcode: "ADD" }]);
  expect(() => run(mod)).toThrow(StackUnderflow);
});

test("run throws StackOverflow when stack exceeds maxStackDepth", () => {
  const mod = mainModule([
    { opcode: "PUSH", value: 1 },
    { opcode: "PUSH", value: 2 },
    { opcode: "PUSH", value: 3 },
  ]);
  expect(() => run(mod, { maxStackDepth: 2 })).toThrow(StackOverflow);
});

test("run throws UndefinedVariable on LOAD_G of missing binding", () => {
  const mod = mainModule([{ opcode: "LOAD_G", name: "nope" }]);
  expect(() => run(mod)).toThrow(UndefinedVariable);
});

test("CALL / RETURN: no-arg callee returns constant", () => {
  const mod: BytecodeModule = {
    main: {
      name: "__main",
      params: [],
      code: [{ opcode: "CALL", fnIndex: 0, argc: 0 }, { opcode: "HALT" }],
    },
    functions: [
      {
        name: "k",
        params: [],
        code: [{ opcode: "PUSH", value: 42 }, { opcode: "RETURN" }],
      },
    ],
  };
  expect(run(mod)).toBe(42);
});

test("CALL / RETURN: single-arg callee doubles via LOAD_L", () => {
  const mod: BytecodeModule = {
    main: {
      name: "__main",
      params: [],
      code: [
        { opcode: "PUSH", value: 7 },
        { opcode: "CALL", fnIndex: 0, argc: 1 },
        { opcode: "HALT" },
      ],
    },
    functions: [
      {
        name: "double",
        params: ["x"],
        code: [
          { opcode: "LOAD_L", name: "x" },
          { opcode: "PUSH", value: 2 },
          { opcode: "MUL" },
          { opcode: "RETURN" },
        ],
      },
    ],
  };
  expect(run(mod)).toBe(14);
});

test("CALL / RETURN: recursion counts down to zero", () => {
  const mod: BytecodeModule = {
    main: {
      name: "__main",
      params: [],
      code: [
        { opcode: "PUSH", value: 3 },
        { opcode: "CALL", fnIndex: 0, argc: 1 },
        { opcode: "HALT" },
      ],
    },
    functions: [
      {
        name: "count",
        params: ["n"],
        code: [
          { opcode: "LOAD_L", name: "n" },
          { opcode: "JMP_IF_ZERO", target: 7 },
          { opcode: "LOAD_L", name: "n" },
          { opcode: "PUSH", value: 1 },
          { opcode: "SUB" },
          { opcode: "CALL", fnIndex: 0, argc: 1 },
          { opcode: "RETURN" },
          { opcode: "PUSH", value: 0 },
          { opcode: "RETURN" },
        ],
      },
    ],
  };
  expect(run(mod)).toBe(0);
});

test("STORE_L then LOAD_L round-trips inside a callee", () => {
  const mod: BytecodeModule = {
    main: {
      name: "__main",
      params: [],
      code: [{ opcode: "CALL", fnIndex: 0, argc: 0 }, { opcode: "HALT" }],
    },
    functions: [
      {
        name: "f",
        params: [],
        code: [
          { opcode: "PUSH", value: 99 },
          { opcode: "STORE_L", name: "x" },
          { opcode: "LOAD_L", name: "x" },
          { opcode: "RETURN" },
        ],
      },
    ],
  };
  expect(run(mod)).toBe(99);
});

test("nested CALL isolates locals named x", () => {
  const mod: BytecodeModule = {
    main: {
      name: "__main",
      params: [],
      code: [{ opcode: "CALL", fnIndex: 0, argc: 0 }, { opcode: "HALT" }],
    },
    functions: [
      {
        name: "outer",
        params: [],
        code: [
          { opcode: "PUSH", value: 1 },
          { opcode: "STORE_L", name: "x" },
          { opcode: "CALL", fnIndex: 1, argc: 0 },
          { opcode: "LOAD_L", name: "x" },
          { opcode: "RETURN" },
        ],
      },
      {
        name: "inner",
        params: [],
        code: [
          { opcode: "PUSH", value: 99 },
          { opcode: "STORE_L", name: "x" },
          { opcode: "PUSH", value: 0 },
          { opcode: "RETURN" },
        ],
      },
    ],
  };
  expect(run(mod)).toBe(1);
});

test("FrameStackOverflow when frame depth cap exceeded", () => {
  const mod: BytecodeModule = {
    main: {
      name: "__main",
      params: [],
      code: [{ opcode: "CALL", fnIndex: 0, argc: 0 }, { opcode: "HALT" }],
    },
    functions: [
      {
        name: "rec",
        params: [],
        code: [{ opcode: "CALL", fnIndex: 0, argc: 0 }, { opcode: "RETURN" }],
      },
    ],
  };
  expect(() => run(mod, { maxFrameDepth: 4 })).toThrow(FrameStackOverflow);
});

test("maxStackDepth and maxFrameDepth are independent", () => {
  const mod: BytecodeModule = {
    main: {
      name: "__main",
      params: [],
      code: [{ opcode: "CALL", fnIndex: 0, argc: 0 }, { opcode: "HALT" }],
    },
    functions: [
      {
        name: "rec",
        params: [],
        code: [{ opcode: "CALL", fnIndex: 0, argc: 0 }, { opcode: "RETURN" }],
      },
    ],
  };
  expect(() => run(mod, { maxFrameDepth: 4, maxStackDepth: 10_000 })).toThrow(
    FrameStackOverflow,
  );
  expect(() => run(mod, { maxFrameDepth: 4, maxStackDepth: 4 })).toThrow(
    FrameStackOverflow,
  );
});
